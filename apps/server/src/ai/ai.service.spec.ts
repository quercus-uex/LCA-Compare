import { AiService, DEFAULT_MODEL } from './ai.service';

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

  it.each([
    ['the default model when OPENROUTER_MODEL is empty', '', DEFAULT_MODEL],
    [
      'the trimmed OPENROUTER_MODEL when set',
      ' anthropic/claude-sonnet-4 ',
      'anthropic/claude-sonnet-4',
    ],
  ])(
    'renders the prompt template and sends it to OpenRouter using %s',
    async (_case, envModel, expectedModel) => {
      process.env.OPENROUTER_MODEL = envModel;

      const result = await service.generateFromTemplate(
        'compare-recommendations',
        { data: 'El conjunto objetivo reduce el impacto climático.' },
      );

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
          model: expectedModel,
        },
      });
      expect(result).toBe('generated text');
    },
  );

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
