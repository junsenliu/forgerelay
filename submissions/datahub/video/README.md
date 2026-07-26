# ForgeRelay DataHub demo video

This Remotion project reproduces the public English demo video for ForgeRelay's
Build with DataHub submission.

Public video: <https://youtu.be/cg_hcuHM5XQ>

## What is included

- a 1920×1080, 30 fps Remotion composition
- real screenshots from the local ForgeRelay application
- synthetic DataHub lineage and policy visuals
- Microsoft Ava Neural English narration
- word-timed English captions rendered into the video
- the entrant-owned LinkSea mark used only for the closing attribution

The output MP4 is intentionally ignored because YouTube hosts the public
submission video. All source files, inputs, screenshots, captions, and
reproduction scripts remain in this directory.

## Reproduce

```console
npm install
npm run lint
npm run render
```

The generated video is written to:

```text
out/forgerelay-datahub-demo.mp4
```

To refresh the voiceover, run `npm run voiceover`. This command uses the
passwordless Microsoft Edge neural speech endpoint through `edge-tts`; no API
key is stored. To refresh the captions after changing narration, run
`npm run captions`.

`npm run capture` visits the local ForgeRelay application at
`http://127.0.0.1:3000`, loads the synthetic sample, runs the analysis, and
captures the evidence frames used by the composition.

## Safety

- screenshots and narration contain synthetic data only
- no customer or supplier material is included
- no credentials are needed to render the committed source
- the local `.env`, browser profile, dependencies, and rendered output are
  ignored
