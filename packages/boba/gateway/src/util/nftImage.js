/* eslint-disable quotes */
/*
Copyright 2021-present Boba Network.

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

const isIpfsUrl = (url) => {
    return url.includes('ipfs://');
  };
  
  const getIpfsUrl = (url) => {
    const payload = url.split('://')[1];
    return `https://ipfs.io/ipfs/${payload}`;
  };
  
  export const getNftImageUrl = async (url) => {
    try {
      if (url.startsWith('data:application/json;base64,')) { // we have an svg
        const json = Buffer.from(url.substring(29), 'base64').toString();
        const { image_data, attributes = [], description, name } = JSON.parse(json);
        return {
          url: image_data ? `data:image/svg+xml;base64,${Buffer.from(image_data, 'base64').toString()}` : null,
          meta: {
            attributes,
            traits: [],
            collection: description,
            rank: '',
            id: '',
            rarity_score: '',
            name,
          },
        };
      }
  
      const URL = isIpfsUrl(url) ? getIpfsUrl(url) : url;
      const { data, headers } = await axios.get(URL);
      if (headers?.['content-type']?.includes('application/json')) {
        const { image, ...meta } = data;
        return {
          url: isIpfsUrl(image) ? getIpfsUrl(image) : image,
          meta: {
            traits: [],
            ...meta,
          },
        };
      } else {
        return { url };
      }
    } catch (error) {
      console.log('Error while loading NFT image url', error.message);
      return { url };
    }
  };
