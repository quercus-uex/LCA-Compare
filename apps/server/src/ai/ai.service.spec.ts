import { AiService } from './ai.service';
import { OpenRouter } from '@openrouter/sdk';

jest.mock('@openrouter/sdk', () => {
  const send = jest.fn();
  return {
    OpenRouter: jest.fn().mockImplementation(() => ({
      chat: { send },
    })),
    __sendMock: send,
  };
});

describe('AiService', () => {
  const originalEnv = process.env;
  let service: AiService;
  let sendMock: jest.Mock;

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'sk-or-test',
      OPENROUTER_MODEL: '',
    };
    sendMock = jest.requireMock<{ __sendMock: jest.Mock }>(
      '@openrouter/sdk',
    ).__sendMock;
    sendMock.mockResolvedValue({
      choices: [{ message: { content: 'generated text' } }],
    });
    service = new AiService();
  });

  it('loads prompt templates, renders context, and sends the prompt to OpenRouter using the default model', async () => {
    const result = await service.generateFromTemplate(
      'compare-recommendations',
      { data: 'El conjunto objetivo reduce el impacto climático.' },
    );

    expect(OpenRouter).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      chatGenerationParams: {
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(
              'Resumen: El conjunto objetivo reduce el impacto climático.',
            ),
          },
        ],
        model: 'openai/gpt-oss-120b:nitro',
      },
    });
    expect(result).toBe('generated text');
  });

  it('uses an explicitly provided model when generating from a template', async () => {
    await service.generateFromTemplate(
      'compare-overview',
      { data: '{"impacto_total":[]}' },
      'anthropic/claude-sonnet-4',
    );

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        chatGenerationParams: expect.objectContaining({
          model: 'anthropic/claude-sonnet-4',
        }),
      }),
    );
  });

  it('uses OPENROUTER_MODEL when no model is provided', async () => {
    process.env.OPENROUTER_MODEL = ' anthropic/claude-sonnet-4 ';

    await service.generateFromTemplate('compare-overview', {
      data: '{"impacto_total":[]}',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        chatGenerationParams: expect.objectContaining({
          model: 'anthropic/claude-sonnet-4',
        }),
      }),
    );
  });

  it('throws before calling OpenRouter when the requested template does not exist', async () => {
    await expect(
      service.generateFromTemplate('missing-template', { data: 'x' }),
    ).rejects.toThrow('Template missing-template not found');

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns empty text without calling OpenRouter when OPENROUTER_API_KEY is not set', async () => {
    process.env.OPENROUTER_API_KEY = '';

    const result = await service.generateFromTemplate('compare-overview', {
      data: '{"impacto_total":[]}',
    });

    expect(result).toBe('');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
