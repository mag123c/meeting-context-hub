import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFileSync, execFile as execFileCb } from 'child_process';
import { checkFfmpeg, convertToWav } from './ffmpeg-converter.js';

vi.mock('child_process', async () => {
  const actual = await vi.importActual('child_process');
  return {
    ...actual,
    execFileSync: vi.fn(),
    execFile: vi.fn(),
  };
});

const mockedExecFileSync = vi.mocked(execFileSync);
const mockedExecFile = vi.mocked(execFileCb);

describe('checkFfmpeg', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return true when ffmpeg is available', () => {
    mockedExecFileSync.mockReturnValue(Buffer.from('ffmpeg version 6.0'));
    expect(checkFfmpeg()).toBe(true);
  });

  it('should return false when ffmpeg is not found', () => {
    mockedExecFileSync.mockImplementation(() => { throw new Error('not found'); });
    expect(checkFfmpeg()).toBe(false);
  });
});

describe('convertToWav', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should call ffmpeg with correct arguments', async () => {
    // checkFfmpeg pass
    mockedExecFileSync.mockReturnValue(Buffer.from('ffmpeg version 6.0'));

    (mockedExecFile as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, args: string[], _opts: Record<string, unknown>, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
        cb(null, '', '');
        return {};
      },
    );

    const inputPath = '/tmp/test-input.m4a';

    try {
      await convertToWav(inputPath);
    } catch {
      // output file won't exist in mock — that's OK
    }

    expect(mockedExecFile).toHaveBeenCalledWith(
      'ffmpeg',
      expect.arrayContaining([
        '-i', inputPath,
        '-ar', '16000',
        '-ac', '1',
        '-acodec', 'pcm_s16le',
        '-f', 'wav',
      ]),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('should throw TRANSCRIPTION_FFMPEG_NOT_FOUND when ffmpeg is missing', async () => {
    mockedExecFileSync.mockImplementation(() => { throw new Error('not found'); });

    await expect(convertToWav('/tmp/test.m4a')).rejects.toThrow('ffmpeg');
  });

  it('should throw on ffmpeg conversion error', async () => {
    mockedExecFileSync.mockReturnValue(Buffer.from('ffmpeg version 6.0'));

    (mockedExecFile as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, _args: string[], _opts: Record<string, unknown>, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
        cb(new Error('conversion failed'), '', '');
        return {};
      },
    );

    await expect(convertToWav('/tmp/test.m4a')).rejects.toThrow('conversion failed');
  });
});
