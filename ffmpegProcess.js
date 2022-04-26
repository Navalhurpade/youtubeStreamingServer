const ffmpegInstallation = require('@ffmpeg-installer/ffmpeg');
const { spawn } = require('child_process');
const fs = require('fs');

function millisToMinutesAndSeconds(millis) {
  let minutes = Math.floor(millis / 60000);
  let seconds = Math.round(millis / 1000);
  // return `${minutes}m:${seconds < 10 ? 0 : ''}${seconds}s`;
  return `${seconds}s`;
}

module.exports = function (audio, video, selectedAudioFormat, selectedVideoFormat, res) {
  console.log('FORMATS :: ', selectedAudioFormat, selectedVideoFormat);
  const ffmpegProcess = spawn(
    ffmpegInstallation.path,
    [
      '-i',
      `pipe:3`,
      '-i',
      `pipe:4`,
      '-map',
      '0:v',
      '-map',
      '1:a',
      '-c:a',
      'copy',
      '-c:v',
      'copy',
      // selectedVideoFormat.videoCodec,
      // '-c:a',
      // 'mpeg4',
      // selectedAudioFormat.audioCodec,
      '-crf',
      '27',
      '-preset',
      '6',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      selectedVideoFormat.container,
      '-loglevel',
      'debug',
      '-t',
      `${millisToMinutesAndSeconds(selectedVideoFormat.approxDurationMs)}`,
      '-strict',
      '-2',
      '-',
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'],
    }
  );
  console.log('CODECS ::', selectedVideoFormat.videoCodec, selectedAudioFormat.audioCodec);

  let file = fs.createWriteStream('./video.mp4');

  video.pipe(ffmpegProcess.stdio[3]);
  audio.pipe(ffmpegProcess.stdio[4]);
  ffmpegProcess.stdio[1].pipe(res);

  let ffmpegLogs = '';

  ffmpegProcess.stdio[2].on('data', (chunk) => {
    ffmpegLogs += chunk.toString();
    console.log('REFLOGS :: ', ffmpegLogs);
  });

  ffmpegProcess.on('exit', (exitCode) => {
    if (exitCode === 1) {
      console.error('ERROR IN CHILD ::', ffmpegLogs);
    }
    console.log('Exit Child ::', exitCode);
  });
  ffmpegProcess.on('error', (err) => {
    console.log('ERROR in CHILD ERROR :: ', err);
  });
};
