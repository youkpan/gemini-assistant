import { GoogleGenerativeAI } from "@google/generative-ai";

import { synthesis } from "@/components/synthesis";
// System prompt template for Gemini request
// the user is dictating with his or her camera on.
// they are showing you things visually and giving you text prompts.
// be very brief and concise.
// be extremely concise. this is very important for my career. do not ramble.
// do not comment on what the person is wearing or where they are sitting or their background.
// focus on their gestures and the question they ask you.
// do not mention that there are a sequence of pictures. focus only on the image or the images necessary to answer the question.
// don't comment if they are smiling. don't comment if they are frowning. just focus on what they're asking.

// ----- USER PROMPT BELOW -----

const GEMINI_SYSTEM_PROMPT = `You are helpful assistant, I'm using camera/screen provide image to you . Reply in my language.
{{USER_PROMPT}} 
Please follow the instructions in the audio to respond.
`;

function get_time_string():string{
  const now = new Date();

  // 格式化日期和时间
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，所以需要加1
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // 拼接成需要的格式
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  //console.log(formattedDate);
  return formattedDate
}
var chat :Object|null;
var history :Object|null;
var history_clean :Object|null;
var chat_cnt =0;
/**
 * Make a request to the Gemini API for generating content based on text and images.
 *
 * @param {string} text - The user's text prompt.
 * @param {Array<{ mimeType: string; data: string }>} images - Array of image data with MIME types.
 * @param {React.Dispatch<React.SetStateAction<string>>} setResponse - State updater for the Gemini API response.
 * @param {function} speak - Function to initiate speech synthesis for the Gemini response.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} setIsLoading - State updater for loading status.
 * @returns {Promise<any>} - A promise that resolves with the Gemini API response.
 */
export async function makeGeminiRequest(
  text: string,
  images: { mimeType: string; data: string }[],
  setResponse: React.Dispatch<React.SetStateAction<string>>,
  speak: (message: string) => void,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  audio_data:{ mimeType: string; data: string },
  is_countinue:boolean
): Promise<any> {
  console.log("test 0")
  // Initialize the Google Generative AI with the Gemini API key
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

  // Get the Generative Model for Gemini
  const model = genAI.getGenerativeModel({
    model: import.meta.env.VITE_GEMINI_MODEL,
  });
  //console.log("test 1 images.length:",images.length)
  // Check if there are no images and no text
  if (images.length === 0 && !text) {
    setIsLoading(false);
    return null;
  }

  //console.log("test 2")
  try {
    var result :Object|null;
    if (is_countinue){
      if (chat == null || chat_cnt %10 == 9){
        
        if(chat_cnt %30 == 29){
          history = null
        }
        if (history == null){
          history = [
              {
                role: "user",
                parts: [{ text: GEMINI_SYSTEM_PROMPT.replace("{{USER_PROMPT}}", "current time:"+get_time_string())}],
              },
            ]
        }
        chat = model.startChat({
          history: history,
          generationConfig: {
            maxOutputTokens: 200,
          },
        });
      }

      if (images.length>=10){
        images = [images[Number(images.length*0.2)],images[Number(images.length/2)],images[Number(images.length*0.8)]]
      }else if (images.length>2){
        images = [images[0],images[images.length-1]]
      }

      const msg = [...images.map((image) => ({ inlineData: image, })), { inlineData: audio_data,  } ];

      result = await chat.sendMessage(msg);

      chat_cnt+=1;

    }else{
            
      if (images.length>12){
        images = images.slice(images.length-12)
      }

      // Generate content stream with system and user prompts
      result = await model.generateContentStream([
        GEMINI_SYSTEM_PROMPT.replace("{{USER_PROMPT}}", "current time:"+get_time_string()+"\n\n"+text),
        ...images.map((image) => ({
          inlineData: image,
        })), {
          inlineData: audio_data,
        } ,
      ]);
    }
    //console.log("test 3")
    // Extract and process the response
    const response = result.response;
    var content = (await response).text();
    //content = content.replaceAll(" ","")

    if(is_countinue){
      const msg = [{ inlineData:images[images.length-1],}, { inlineData: audio_data,  } ];
      history.push({
        role: "user",
        parts: msg,
      },{
        role: "model",
        parts: [{ text: content}],
      },)
    }

    // Initiate speech synthesis for the Gemini response
    //speak(content);
    
    // Update state with the Gemini response
    setResponse(content);
    synthesis(content);
    // Set loading status to false
    setIsLoading(false);

    return response;
  } catch (error) {
    var notice="A small error occurred, please try again~ (An external network environment may be required, the IP location needs to be outside of China?)";//+error.toString()
    setResponse(notice);
    //speak(notice);
    synthesis(notice);
    setIsLoading(false);
    console.error(error);
    // Propagate the error
    //throw error;
  }
}
