/* eslint-disable quotes */
/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
import axios from 'axios';

const isIpfsUrl = (url) =>{
    return !!url.includes('ipfs://')
}

const getIpfsUrl = (url) => {
    let payload = url.split('://')[1]; 
    return `https://ipfs.io/ipfs/${payload}`
}

export const getNftImageUrl = async (url) => {
    try {

        let URL = !!isIpfsUrl(url) ? getIpfsUrl(url) : url

        let res = await axios.get(URL)

/*
{
   "collection":"BobaPunks",
   "rank":"8970",
   "id":3491,
   "image":"https://ipfs.io/ipfs/QmTqPtJ893q9mTHzvjB1nYs2FNyYzXJr2sg4CHrndF5EJC/3491.png",
   "traits":[
      {
         "trait_type":"Gender",
         "trait_value":"Male"
      },
      {
         "trait_type":"background",
         "trait_value":"Data Stream"
      },
      {
         "trait_type":"eyes",
         "trait_value":"regular shades"
      },
      {
         "trait_type":"head",
         "trait_value":"messy hair"
      },
      {
         "trait_type":"type",
         "trait_value":"human dark"
      }
   ],
   "rarity_score":28.57,
   "name":"Bobapunk #3491"
}
*/
        if (res.headers && res.headers['content-type'].includes('application/json')) {

            const { 
                image, 
                attributes = [], 
                traits = [], 
                collection = '', 
                rank = '', 
                id = '',
                rarity_score = '',
                name = '' 
            } = res.data

            //console.log("image:",image)
            //console.log("attributes:",attributes)
            //console.log("traits:",traits)
            return { 
                url: !!isIpfsUrl(image) ? getIpfsUrl(image) : image,
                meta: { 
                    attributes,
                    traits,
                    collection,
                    rank,
                    id,
                    rarity_score,
                    name 
                }
            }
        } else {
            return { url }
        }
    } catch (error) {
        // In case of error returning same url
        // As seems like some time it can be cors for images.
        console.log('Error while loading NFT image url', error.message);
        return { url }
    }
}


