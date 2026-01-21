declare module "mic" {
  import { Readable } from "stream";

  interface MicConfig {
    rate?: string;
    channels?: string;
    debug?: boolean;
    exitOnSilence?: number;
    fileType?: string;
    device?: string;
    bitwidth?: string;
    encoding?: string;
    endian?: string;
  }

  interface MicInstance {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    getAudioStream(): Readable;
  }

  function mic(config?: MicConfig): MicInstance;
  export = mic;
}
