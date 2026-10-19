import {
  InternalServerErrorException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import path from 'node:path';
import fs from 'node:fs';
import Handlebars from 'handlebars';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly templates: Map<string, HandlebarsTemplateDelegate>;
  private readonly openRouter: OpenRouter;

  constructor() {
    this.openRouter = new OpenRouter();
    this.templates = this.loadTemplates();
  }

  private loadTemplates() {
    const promptsDir = path.join(__dirname, 'prompts');
    const files = fs.readdirSync(promptsDir);
    const map = new Map<string, HandlebarsTemplateDelegate>();

    for (const file of files) {
      const name = file.replace('.prompt.hbs', '');
      const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
      map.set(name, Handlebars.compile(content));
    }

    return map;
  }

  async generateFromTemplate(
    templateName: string,
    context: Record<string, string>,
    model?: string,
  ): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template)
      throw new InternalServerErrorException(
        `Template ${templateName} not found`,
      );
    // La IA es opcional: sin clave de OpenRouter se devuelve texto vacío y el
    // informe omite las secciones generadas
    if (!process.env.OPENROUTER_API_KEY?.trim()) {
      this.logger.warn(
        `OPENROUTER_API_KEY not set: skipping AI generation for ${templateName}`,
      );
      return '';
    }
    const content = template(context);

    const response = await this.openRouter.chat.send({
      chatGenerationParams: {
        messages: [{ role: 'user', content }],
        model: model ?? 'openai/gpt-oss-120b:nitro',
      },
    });
    return response.choices[0].message.content as string;
  }
}
