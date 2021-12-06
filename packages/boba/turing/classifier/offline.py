import predict
# from PIL import Image
import json
import sys
import requests
from io import BytesIO


def prediction():
    url = "https://i.insider.com/5484d9d1eab8ea3017b17e29?width=1300&format=jpeg&auto=webp"
    response = requests.get(url)
    # image = BytesIO(requests.get(url).content)
    image = BytesIO(response.content)
    output = predict.predict(image)
    return json.dumps(output)


if __name__ == '__main__':
    print(prediction())