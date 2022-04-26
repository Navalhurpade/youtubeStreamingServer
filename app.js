const express = require('express');
const ytdl = require('ytdl-core');
const FfmpegCommand = require('fluent-ffmpeg');
const converterProcess = require('./ffmpegProcess');

const app = express();

app.use(express.json());

app.get('/', async (req, res) => {
  let url = 'https://www.youtube.com/watch?v=0cbXeXP2Wgg';
  let data = await ytdl.getInfo(url);
  let audioFormat = ytdl.filterFormats(data.formats, 'audioonly');

  let videoFormat = ytdl.filterFormats(data.formats, 'videoonly');

  let selectedAudioFormat = audioFormat.sort((formatA, formatB) => formatB.audioBitrate - formatA.audioBitrate)[0];

  let selectedVideoFormat = videoFormat.sort((formatA, formatB) => {
    if (formatB.height === formatA.height) {
      if (formatB.container === 'mp4') return 1;
      return formatB.fps - formatA.fps;
    }
    return formatB.height - formatA.height;
  })[0];

  try {
    // res.send(data)
    let audio = ytdl.downloadFromInfo(data, {
      format: selectedAudioFormat,
      quality: 'highestaudio',
    });

    let video = ytdl.downloadFromInfo(data, {
      quality: 'highestvideo',
      format: selectedVideoFormat,
    });

    // res.send({selectedAudioFormat, selectedVideoFormat});
    converterProcess(audio, video, selectedAudioFormat, selectedVideoFormat, res);

    // FfmpegCommand()
    //  .input(video)
    //  .input(audio)
    //  .mergeToFile(`file.${selectedVideoFormat.container}`)
    //  .pipe(res);
    //

    res.setHeader('Content-Disposition', 'attachment;filename=' + 'sas.' + selectedVideoFormat.container);
    res.setHeader('Content-Type', 'video/mp4');

    // res.send(data.formats.filter((q) => q.qualityLabel === '2160p' && q.container === 'mp4')[0]);
  } catch (e) {
    console.log(e);
  }
});

app.listen(8080, (err) => {
  if (err) console.log(err);
  console.log('Server is running on 8080');
});
