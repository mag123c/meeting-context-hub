import { describe, it, expect } from 'vitest';
import { detectAudioFormat, isWavFormat } from './audio-format.js';

describe('detectAudioFormat', () => {
  it('should detect WAV (RIFF header)', () => {
    const buf = Buffer.alloc(12);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(100, 4);
    buf.write('WAVE', 8);
    expect(detectAudioFormat(buf)).toBe('wav');
  });

  it('should detect MP3 (ID3 tag)', () => {
    const buf = Buffer.alloc(4);
    buf.write('ID3', 0);
    expect(detectAudioFormat(buf)).toBe('mp3');
  });

  it('should detect MP3 (sync word 0xFFfb)', () => {
    const buf = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    expect(detectAudioFormat(buf)).toBe('mp3');
  });

  it('should detect MP3 (sync word 0xFFf3)', () => {
    const buf = Buffer.from([0xff, 0xf3, 0x90, 0x00]);
    expect(detectAudioFormat(buf)).toBe('mp3');
  });

  it('should detect MP3 (sync word 0xFFf2)', () => {
    const buf = Buffer.from([0xff, 0xf2, 0x90, 0x00]);
    expect(detectAudioFormat(buf)).toBe('mp3');
  });

  it('should detect M4A/MP4 (ftyp at offset 4)', () => {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(32, 0); // box size
    buf.write('ftyp', 4);
    expect(detectAudioFormat(buf)).toBe('m4a');
  });

  it('should detect OGG', () => {
    const buf = Buffer.alloc(4);
    buf.write('OggS', 0);
    expect(detectAudioFormat(buf)).toBe('ogg');
  });

  it('should detect FLAC', () => {
    const buf = Buffer.alloc(4);
    buf.write('fLaC', 0);
    expect(detectAudioFormat(buf)).toBe('flac');
  });

  it('should detect WebM (EBML header 0x1A45DFA3)', () => {
    const buf = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    expect(detectAudioFormat(buf)).toBe('webm');
  });

  it('should return unknown for unrecognized data', () => {
    const buf = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(detectAudioFormat(buf)).toBe('unknown');
  });

  it('should return unknown for empty buffer', () => {
    const buf = Buffer.alloc(0);
    expect(detectAudioFormat(buf)).toBe('unknown');
  });
});

describe('isWavFormat', () => {
  it('should return true for WAV buffer', () => {
    const buf = Buffer.alloc(12);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(100, 4);
    buf.write('WAVE', 8);
    expect(isWavFormat(buf)).toBe(true);
  });

  it('should return false for M4A buffer', () => {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(32, 0);
    buf.write('ftyp', 4);
    expect(isWavFormat(buf)).toBe(false);
  });
});
