# Google Gemini Voice/Vision Assistant<sub><sup> 
## with gemini-1.5-pro/gemini-1.5-flash modal</sup></sub>

[![Gemini Demo](/img/Screenshot.jpg)]()

Explore the remarkable capabilities of Gemini, an open-source application powered by the Google Gemini Vision API(Gemini-1.5-flash / gemini-1.5-pro  modal). Seamlessly reasoning across text, and images and voice. Gemini is your gateway to the future of AI.

You can use your camera and screen capture (chrome browser) ! .

If you like this repo, Give me a star ⭐ ~ 

## 🚀 Quick Start

**Demo:** [Gemini Assistant Demo](https://v.stylee.top:3000/)

#### step: 1 Clone the repository

```bash
git clone https://github.com/youkpan/gemini-assistant.git
```

#### step: 2

```bash
npm install
```

#### step:3 🔑 Setup Gemini API Key: Rename `.env.example` to `.env` and paste your Gemini API key in `VITE_GEMINI_KEY`.

[Get GEMINI_KEY](https://ai.google.dev/gemini-api/docs/api-key?hl=zh-cn) | [Get azure TTS Subscription key](https://www.google.com/search?q=azure+Subscription+key+tts&oq=azure+Subscription+key+tt)

Addtional:

VITE_GEMINI_MODEL="gemini-1.5-flash-latest"
#"gemini-1.5-pro" or "gemini-1.5-flash"

### change your TTS key(azure ,in file [src/components/synthesis.tsx](src/components/synthesis.tsx) line 13):
```javascript
var subscriptionKey = "your azure subscriptionKey" ;
var serviceRegion =  "your serviceRegion e.g eastasia"  ;
```
#### step:4 Run locally

```bash
npm run dev
#or
npm run dev -- --host 0.0.0.0
#or
./run.sh (change your key in file)
```

Visit [localhost:3000](http://localhost:3000/) to experience Gemini on your machine.

## Note : your must have https cert to start public server! or not have camera permission.

## 🌟 Give me a Star : )

Enjoying Gemini? Show your support by giving it a star on GitHub! ⭐

## 🤖 How it Works

Simply say "Hey Gemini," show an object to the camera, and witness the magic of multimodal AI.

## 🌐 Learn More

Visit the [Gemini api doc](https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=node&hl=zh-cn#multi-turn-conversations-chat) for in-depth information about Gemini's capabilities.

Thanks [iamsrikanthnani](https://github.com/iamsrikanthnani/gemini) for init version.

## 🙌 Contribute

Your contributions make Gemini even more powerful.

Unlock the potential of AI with Gemini—your gateway to the future.

## Happy Coding! 🚀
