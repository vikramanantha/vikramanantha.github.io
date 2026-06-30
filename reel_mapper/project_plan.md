# Reel Mapper
Vikram Anantha
Summer 2026

## Motivation

I get a lot of Instagram Reels saying "here's the best cafe's to study in in SF" or "top 10 sunset spots in nyc". If I want to save them, then I have to manually go into google maps and save each one manually. Surely there is a better way.

## Method

I think there should be a good way to make this work. I know in Beeper they use some API to get the instagram reels (provided they have an Instagram log-in token) and get the video from the reel. I know this because it is very easy to download the video from the beeper app. There has to be some way they do it.

Once the video is extracted, I think using some MLLM to understand the video and get the important details.

Then, a google maps API will take all the important places and then add it to my google maps list.

There are 4 scripts that accomplish this:

### `fetch_reel.py`
This gets the reel from Instagram and downloads the video. It's a pretty simple task. 

This requires an instagram session token, which has to be regenerated about once every 90 days or so?

### `gemini_video.py`
This takes the downloaded video, uploads it to Google, and has Gemini run inference on that video. The prompt given to gemini is "Watch this video carefully and extract every specific place or location mentioned. Look for place names in text overlays, spoken narration, on-screen captions, and graphics. Return ONLY a JSON array. No explanation, no markdown fences, just raw JSON."

This requires the Gemini API Key.

### `google_maps.py`
This takes each place that was given by Gemini and uses the Places API to get the google maps link. Unfortunately, there is no API to add things to a Google Maps list, so I will have to figure out a good medium to save this list.

This requires a Google Maps API Key.

## Usability

The actual functionality of this works, because it will save the place based on the reel. The usability of this is where things get hard, because I don't know how to host this in a way that would be easy for me to use properly.

My first idea is to convert all of this to JavaScript code, and put this all on my github website. Then, make it so that I can paste the link of a Reel into a textbox, and it will do this automatically. This would require that the my_locations.json is stored somewhere else on an actual server, so I'll have to find a place for free, that way I won't need to keep reuploading it to GitHub.

Then, I would have to display the map on this website too. This could be done, and would serve as a pretty good first draft.