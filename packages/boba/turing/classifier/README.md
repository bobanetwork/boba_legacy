<p align="center">
	<img src="https://storage.googleapis.com/kaggle-competitions/kaggle/3362/media/woof_meow.jpg">
</p>

# Cat Vs Dog Classifier

### About

In this project, we build an algorithm, a deep learning model to classify whether images contain either a dog or a cat.  This is easy for humans, dogs, and cats. Computers find it a bit more difficult.

### Data

The dataset is available at Kaggle and has been provided officially by Microsoft Research.You can find it [here](https://www.kaggle.com/c/dogs-vs-cats/data).

### Requirements

We recommend to create a virtual environment using [conda](https://anaconda.org/anaconda/conda) or [virtualenv](https://pypi.org/project/virtualenv/), and then setup environment using `pip install -r requirements.txt` for setting up the environment. We have used **Python 3.6.7** for development. Below is the detailed 

```
torch==1.1.0
torchvision==0.3.0
Flask==1.0.3
Pillow==6.0.0
numpy==1.15.4
pandas==0.23.4
matplotlib==3.0.2
requests==2.22.0
```

### Benchmarks

Our algorithm or model matched an average of 98% accuracy on test set. The best submission on Kaggle for the same is 98.9%. For more details you can check the [leaderboard](https://www.kaggle.com/c/dogs-vs-cats/leaderboard).

Below is the snapshot that was generated when we were training the model and validating its performance.

<p align="center">
    <img src="https://raw.githubusercontent.com/amitrajitbose/cat-v-dog-classifier-pytorch/master/data/training.png">
</p>

### API (REST) Endpoint

**Running The Server**

- Run `python app.py` to start the server, with default port as `8123`. 
- To run on custom port, run `python app.py [PORT]`.

**Accessing The API**

<details>
    <summary>cURL</summary>

    curl -X POST \
        http://127.0.0.1:8123/api \
        -H 'content-type: application/json' \
        -d '{"url":"https://images.unsplash.com/photo-1491604612772-6853927639ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"}'

</details>

<details>
    <summary>Python</summary>

    >>> import requests, os
    >>> url = 'http://127.0.0.1:8123/api'
    >>> data = {
        "url":"https://images.unsplash.com/photo-1491604612772-6853927639ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
    }
    >>> req = requests.post(url, json=data)
    >>> req.json()
    {'class': 'dog', 'confidence': '0.8944258093833923'}
    
</details>

### Architecture

We used a 121-layer DenseNet with a custom classifier for training the above network. It was trained on a GPU and it took approximately 30 minutes for a single epoch. Below is the Keras styled in-detail model summary, generated using [torchsummary](https://pypi.org/project/torchsummary/).

<details>
  <summary>View Complete Architecture</summary>

```
----------------------------------------------------------------
        Layer (type)               Output Shape         Param #
================================================================
            Conv2d-1         [-1, 64, 122, 122]           9,408
       BatchNorm2d-2         [-1, 64, 122, 122]             128
              ReLU-3         [-1, 64, 122, 122]               0
         MaxPool2d-4           [-1, 64, 61, 61]               0
       BatchNorm2d-5           [-1, 64, 61, 61]             128
              ReLU-6           [-1, 64, 61, 61]               0
            Conv2d-7          [-1, 128, 61, 61]           8,192
       BatchNorm2d-8          [-1, 128, 61, 61]             256
              ReLU-9          [-1, 128, 61, 61]               0
           Conv2d-10           [-1, 32, 61, 61]          36,864
      BatchNorm2d-11           [-1, 96, 61, 61]             192
             ReLU-12           [-1, 96, 61, 61]               0
           Conv2d-13          [-1, 128, 61, 61]          12,288
      BatchNorm2d-14          [-1, 128, 61, 61]             256
             ReLU-15          [-1, 128, 61, 61]               0
           Conv2d-16           [-1, 32, 61, 61]          36,864
      BatchNorm2d-17          [-1, 128, 61, 61]             256
             ReLU-18          [-1, 128, 61, 61]               0
           Conv2d-19          [-1, 128, 61, 61]          16,384
      BatchNorm2d-20          [-1, 128, 61, 61]             256
             ReLU-21          [-1, 128, 61, 61]               0
           Conv2d-22           [-1, 32, 61, 61]          36,864
      BatchNorm2d-23          [-1, 160, 61, 61]             320
             ReLU-24          [-1, 160, 61, 61]               0
           Conv2d-25          [-1, 128, 61, 61]          20,480
      BatchNorm2d-26          [-1, 128, 61, 61]             256
             ReLU-27          [-1, 128, 61, 61]               0
           Conv2d-28           [-1, 32, 61, 61]          36,864
      BatchNorm2d-29          [-1, 192, 61, 61]             384
             ReLU-30          [-1, 192, 61, 61]               0
           Conv2d-31          [-1, 128, 61, 61]          24,576
      BatchNorm2d-32          [-1, 128, 61, 61]             256
             ReLU-33          [-1, 128, 61, 61]               0
           Conv2d-34           [-1, 32, 61, 61]          36,864
      BatchNorm2d-35          [-1, 224, 61, 61]             448
             ReLU-36          [-1, 224, 61, 61]               0
           Conv2d-37          [-1, 128, 61, 61]          28,672
      BatchNorm2d-38          [-1, 128, 61, 61]             256
             ReLU-39          [-1, 128, 61, 61]               0
           Conv2d-40           [-1, 32, 61, 61]          36,864
      BatchNorm2d-41          [-1, 256, 61, 61]             512
             ReLU-42          [-1, 256, 61, 61]               0
           Conv2d-43          [-1, 128, 61, 61]          32,768
        AvgPool2d-44          [-1, 128, 30, 30]               0
      BatchNorm2d-45          [-1, 128, 30, 30]             256
             ReLU-46          [-1, 128, 30, 30]               0
           Conv2d-47          [-1, 128, 30, 30]          16,384
      BatchNorm2d-48          [-1, 128, 30, 30]             256
             ReLU-49          [-1, 128, 30, 30]               0
           Conv2d-50           [-1, 32, 30, 30]          36,864
      BatchNorm2d-51          [-1, 160, 30, 30]             320
             ReLU-52          [-1, 160, 30, 30]               0
           Conv2d-53          [-1, 128, 30, 30]          20,480
      BatchNorm2d-54          [-1, 128, 30, 30]             256
             ReLU-55          [-1, 128, 30, 30]               0
           Conv2d-56           [-1, 32, 30, 30]          36,864
      BatchNorm2d-57          [-1, 192, 30, 30]             384
             ReLU-58          [-1, 192, 30, 30]               0
           Conv2d-59          [-1, 128, 30, 30]          24,576
      BatchNorm2d-60          [-1, 128, 30, 30]             256
             ReLU-61          [-1, 128, 30, 30]               0
           Conv2d-62           [-1, 32, 30, 30]          36,864
      BatchNorm2d-63          [-1, 224, 30, 30]             448
             ReLU-64          [-1, 224, 30, 30]               0
           Conv2d-65          [-1, 128, 30, 30]          28,672
      BatchNorm2d-66          [-1, 128, 30, 30]             256
             ReLU-67          [-1, 128, 30, 30]               0
           Conv2d-68           [-1, 32, 30, 30]          36,864
      BatchNorm2d-69          [-1, 256, 30, 30]             512
             ReLU-70          [-1, 256, 30, 30]               0
           Conv2d-71          [-1, 128, 30, 30]          32,768
      BatchNorm2d-72          [-1, 128, 30, 30]             256
             ReLU-73          [-1, 128, 30, 30]               0
           Conv2d-74           [-1, 32, 30, 30]          36,864
      BatchNorm2d-75          [-1, 288, 30, 30]             576
             ReLU-76          [-1, 288, 30, 30]               0
           Conv2d-77          [-1, 128, 30, 30]          36,864
      BatchNorm2d-78          [-1, 128, 30, 30]             256
             ReLU-79          [-1, 128, 30, 30]               0
           Conv2d-80           [-1, 32, 30, 30]          36,864
      BatchNorm2d-81          [-1, 320, 30, 30]             640
             ReLU-82          [-1, 320, 30, 30]               0
           Conv2d-83          [-1, 128, 30, 30]          40,960
      BatchNorm2d-84          [-1, 128, 30, 30]             256
             ReLU-85          [-1, 128, 30, 30]               0
           Conv2d-86           [-1, 32, 30, 30]          36,864
      BatchNorm2d-87          [-1, 352, 30, 30]             704
             ReLU-88          [-1, 352, 30, 30]               0
           Conv2d-89          [-1, 128, 30, 30]          45,056
      BatchNorm2d-90          [-1, 128, 30, 30]             256
             ReLU-91          [-1, 128, 30, 30]               0
           Conv2d-92           [-1, 32, 30, 30]          36,864
      BatchNorm2d-93          [-1, 384, 30, 30]             768
             ReLU-94          [-1, 384, 30, 30]               0
           Conv2d-95          [-1, 128, 30, 30]          49,152
      BatchNorm2d-96          [-1, 128, 30, 30]             256
             ReLU-97          [-1, 128, 30, 30]               0
           Conv2d-98           [-1, 32, 30, 30]          36,864
      BatchNorm2d-99          [-1, 416, 30, 30]             832
            ReLU-100          [-1, 416, 30, 30]               0
          Conv2d-101          [-1, 128, 30, 30]          53,248
     BatchNorm2d-102          [-1, 128, 30, 30]             256
            ReLU-103          [-1, 128, 30, 30]               0
          Conv2d-104           [-1, 32, 30, 30]          36,864
     BatchNorm2d-105          [-1, 448, 30, 30]             896
            ReLU-106          [-1, 448, 30, 30]               0
          Conv2d-107          [-1, 128, 30, 30]          57,344
     BatchNorm2d-108          [-1, 128, 30, 30]             256
            ReLU-109          [-1, 128, 30, 30]               0
          Conv2d-110           [-1, 32, 30, 30]          36,864
     BatchNorm2d-111          [-1, 480, 30, 30]             960
            ReLU-112          [-1, 480, 30, 30]               0
          Conv2d-113          [-1, 128, 30, 30]          61,440
     BatchNorm2d-114          [-1, 128, 30, 30]             256
            ReLU-115          [-1, 128, 30, 30]               0
          Conv2d-116           [-1, 32, 30, 30]          36,864
     BatchNorm2d-117          [-1, 512, 30, 30]           1,024
            ReLU-118          [-1, 512, 30, 30]               0
          Conv2d-119          [-1, 256, 30, 30]         131,072
       AvgPool2d-120          [-1, 256, 15, 15]               0
     BatchNorm2d-121          [-1, 256, 15, 15]             512
            ReLU-122          [-1, 256, 15, 15]               0
          Conv2d-123          [-1, 128, 15, 15]          32,768
     BatchNorm2d-124          [-1, 128, 15, 15]             256
            ReLU-125          [-1, 128, 15, 15]               0
          Conv2d-126           [-1, 32, 15, 15]          36,864
     BatchNorm2d-127          [-1, 288, 15, 15]             576
            ReLU-128          [-1, 288, 15, 15]               0
          Conv2d-129          [-1, 128, 15, 15]          36,864
     BatchNorm2d-130          [-1, 128, 15, 15]             256
            ReLU-131          [-1, 128, 15, 15]               0
          Conv2d-132           [-1, 32, 15, 15]          36,864
     BatchNorm2d-133          [-1, 320, 15, 15]             640
            ReLU-134          [-1, 320, 15, 15]               0
          Conv2d-135          [-1, 128, 15, 15]          40,960
     BatchNorm2d-136          [-1, 128, 15, 15]             256
            ReLU-137          [-1, 128, 15, 15]               0
          Conv2d-138           [-1, 32, 15, 15]          36,864
     BatchNorm2d-139          [-1, 352, 15, 15]             704
            ReLU-140          [-1, 352, 15, 15]               0
          Conv2d-141          [-1, 128, 15, 15]          45,056
     BatchNorm2d-142          [-1, 128, 15, 15]             256
            ReLU-143          [-1, 128, 15, 15]               0
          Conv2d-144           [-1, 32, 15, 15]          36,864
     BatchNorm2d-145          [-1, 384, 15, 15]             768
            ReLU-146          [-1, 384, 15, 15]               0
          Conv2d-147          [-1, 128, 15, 15]          49,152
     BatchNorm2d-148          [-1, 128, 15, 15]             256
            ReLU-149          [-1, 128, 15, 15]               0
          Conv2d-150           [-1, 32, 15, 15]          36,864
     BatchNorm2d-151          [-1, 416, 15, 15]             832
            ReLU-152          [-1, 416, 15, 15]               0
          Conv2d-153          [-1, 128, 15, 15]          53,248
     BatchNorm2d-154          [-1, 128, 15, 15]             256
            ReLU-155          [-1, 128, 15, 15]               0
          Conv2d-156           [-1, 32, 15, 15]          36,864
     BatchNorm2d-157          [-1, 448, 15, 15]             896
            ReLU-158          [-1, 448, 15, 15]               0
          Conv2d-159          [-1, 128, 15, 15]          57,344
     BatchNorm2d-160          [-1, 128, 15, 15]             256
            ReLU-161          [-1, 128, 15, 15]               0
          Conv2d-162           [-1, 32, 15, 15]          36,864
     BatchNorm2d-163          [-1, 480, 15, 15]             960
            ReLU-164          [-1, 480, 15, 15]               0
          Conv2d-165          [-1, 128, 15, 15]          61,440
     BatchNorm2d-166          [-1, 128, 15, 15]             256
            ReLU-167          [-1, 128, 15, 15]               0
          Conv2d-168           [-1, 32, 15, 15]          36,864
     BatchNorm2d-169          [-1, 512, 15, 15]           1,024
            ReLU-170          [-1, 512, 15, 15]               0
          Conv2d-171          [-1, 128, 15, 15]          65,536
     BatchNorm2d-172          [-1, 128, 15, 15]             256
            ReLU-173          [-1, 128, 15, 15]               0
          Conv2d-174           [-1, 32, 15, 15]          36,864
     BatchNorm2d-175          [-1, 544, 15, 15]           1,088
            ReLU-176          [-1, 544, 15, 15]               0
          Conv2d-177          [-1, 128, 15, 15]          69,632
     BatchNorm2d-178          [-1, 128, 15, 15]             256
            ReLU-179          [-1, 128, 15, 15]               0
          Conv2d-180           [-1, 32, 15, 15]          36,864
     BatchNorm2d-181          [-1, 576, 15, 15]           1,152
            ReLU-182          [-1, 576, 15, 15]               0
          Conv2d-183          [-1, 128, 15, 15]          73,728
     BatchNorm2d-184          [-1, 128, 15, 15]             256
            ReLU-185          [-1, 128, 15, 15]               0
          Conv2d-186           [-1, 32, 15, 15]          36,864
     BatchNorm2d-187          [-1, 608, 15, 15]           1,216
            ReLU-188          [-1, 608, 15, 15]               0
          Conv2d-189          [-1, 128, 15, 15]          77,824
     BatchNorm2d-190          [-1, 128, 15, 15]             256
            ReLU-191          [-1, 128, 15, 15]               0
          Conv2d-192           [-1, 32, 15, 15]          36,864
     BatchNorm2d-193          [-1, 640, 15, 15]           1,280
            ReLU-194          [-1, 640, 15, 15]               0
          Conv2d-195          [-1, 128, 15, 15]          81,920
     BatchNorm2d-196          [-1, 128, 15, 15]             256
            ReLU-197          [-1, 128, 15, 15]               0
          Conv2d-198           [-1, 32, 15, 15]          36,864
     BatchNorm2d-199          [-1, 672, 15, 15]           1,344
            ReLU-200          [-1, 672, 15, 15]               0
          Conv2d-201          [-1, 128, 15, 15]          86,016
     BatchNorm2d-202          [-1, 128, 15, 15]             256
            ReLU-203          [-1, 128, 15, 15]               0
          Conv2d-204           [-1, 32, 15, 15]          36,864
     BatchNorm2d-205          [-1, 704, 15, 15]           1,408
            ReLU-206          [-1, 704, 15, 15]               0
          Conv2d-207          [-1, 128, 15, 15]          90,112
     BatchNorm2d-208          [-1, 128, 15, 15]             256
            ReLU-209          [-1, 128, 15, 15]               0
          Conv2d-210           [-1, 32, 15, 15]          36,864
     BatchNorm2d-211          [-1, 736, 15, 15]           1,472
            ReLU-212          [-1, 736, 15, 15]               0
          Conv2d-213          [-1, 128, 15, 15]          94,208
     BatchNorm2d-214          [-1, 128, 15, 15]             256
            ReLU-215          [-1, 128, 15, 15]               0
          Conv2d-216           [-1, 32, 15, 15]          36,864
     BatchNorm2d-217          [-1, 768, 15, 15]           1,536
            ReLU-218          [-1, 768, 15, 15]               0
          Conv2d-219          [-1, 128, 15, 15]          98,304
     BatchNorm2d-220          [-1, 128, 15, 15]             256
            ReLU-221          [-1, 128, 15, 15]               0
          Conv2d-222           [-1, 32, 15, 15]          36,864
     BatchNorm2d-223          [-1, 800, 15, 15]           1,600
            ReLU-224          [-1, 800, 15, 15]               0
          Conv2d-225          [-1, 128, 15, 15]         102,400
     BatchNorm2d-226          [-1, 128, 15, 15]             256
            ReLU-227          [-1, 128, 15, 15]               0
          Conv2d-228           [-1, 32, 15, 15]          36,864
     BatchNorm2d-229          [-1, 832, 15, 15]           1,664
            ReLU-230          [-1, 832, 15, 15]               0
          Conv2d-231          [-1, 128, 15, 15]         106,496
     BatchNorm2d-232          [-1, 128, 15, 15]             256
            ReLU-233          [-1, 128, 15, 15]               0
          Conv2d-234           [-1, 32, 15, 15]          36,864
     BatchNorm2d-235          [-1, 864, 15, 15]           1,728
            ReLU-236          [-1, 864, 15, 15]               0
          Conv2d-237          [-1, 128, 15, 15]         110,592
     BatchNorm2d-238          [-1, 128, 15, 15]             256
            ReLU-239          [-1, 128, 15, 15]               0
          Conv2d-240           [-1, 32, 15, 15]          36,864
     BatchNorm2d-241          [-1, 896, 15, 15]           1,792
            ReLU-242          [-1, 896, 15, 15]               0
          Conv2d-243          [-1, 128, 15, 15]         114,688
     BatchNorm2d-244          [-1, 128, 15, 15]             256
            ReLU-245          [-1, 128, 15, 15]               0
          Conv2d-246           [-1, 32, 15, 15]          36,864
     BatchNorm2d-247          [-1, 928, 15, 15]           1,856
            ReLU-248          [-1, 928, 15, 15]               0
          Conv2d-249          [-1, 128, 15, 15]         118,784
     BatchNorm2d-250          [-1, 128, 15, 15]             256
            ReLU-251          [-1, 128, 15, 15]               0
          Conv2d-252           [-1, 32, 15, 15]          36,864
     BatchNorm2d-253          [-1, 960, 15, 15]           1,920
            ReLU-254          [-1, 960, 15, 15]               0
          Conv2d-255          [-1, 128, 15, 15]         122,880
     BatchNorm2d-256          [-1, 128, 15, 15]             256
            ReLU-257          [-1, 128, 15, 15]               0
          Conv2d-258           [-1, 32, 15, 15]          36,864
     BatchNorm2d-259          [-1, 992, 15, 15]           1,984
            ReLU-260          [-1, 992, 15, 15]               0
          Conv2d-261          [-1, 128, 15, 15]         126,976
     BatchNorm2d-262          [-1, 128, 15, 15]             256
            ReLU-263          [-1, 128, 15, 15]               0
          Conv2d-264           [-1, 32, 15, 15]          36,864
     BatchNorm2d-265         [-1, 1024, 15, 15]           2,048
            ReLU-266         [-1, 1024, 15, 15]               0
          Conv2d-267          [-1, 512, 15, 15]         524,288
       AvgPool2d-268            [-1, 512, 7, 7]               0
     BatchNorm2d-269            [-1, 512, 7, 7]           1,024
            ReLU-270            [-1, 512, 7, 7]               0
          Conv2d-271            [-1, 128, 7, 7]          65,536
     BatchNorm2d-272            [-1, 128, 7, 7]             256
            ReLU-273            [-1, 128, 7, 7]               0
          Conv2d-274             [-1, 32, 7, 7]          36,864
     BatchNorm2d-275            [-1, 544, 7, 7]           1,088
            ReLU-276            [-1, 544, 7, 7]               0
          Conv2d-277            [-1, 128, 7, 7]          69,632
     BatchNorm2d-278            [-1, 128, 7, 7]             256
            ReLU-279            [-1, 128, 7, 7]               0
          Conv2d-280             [-1, 32, 7, 7]          36,864
     BatchNorm2d-281            [-1, 576, 7, 7]           1,152
            ReLU-282            [-1, 576, 7, 7]               0
          Conv2d-283            [-1, 128, 7, 7]          73,728
     BatchNorm2d-284            [-1, 128, 7, 7]             256
            ReLU-285            [-1, 128, 7, 7]               0
          Conv2d-286             [-1, 32, 7, 7]          36,864
     BatchNorm2d-287            [-1, 608, 7, 7]           1,216
            ReLU-288            [-1, 608, 7, 7]               0
          Conv2d-289            [-1, 128, 7, 7]          77,824
     BatchNorm2d-290            [-1, 128, 7, 7]             256
            ReLU-291            [-1, 128, 7, 7]               0
          Conv2d-292             [-1, 32, 7, 7]          36,864
     BatchNorm2d-293            [-1, 640, 7, 7]           1,280
            ReLU-294            [-1, 640, 7, 7]               0
          Conv2d-295            [-1, 128, 7, 7]          81,920
     BatchNorm2d-296            [-1, 128, 7, 7]             256
            ReLU-297            [-1, 128, 7, 7]               0
          Conv2d-298             [-1, 32, 7, 7]          36,864
     BatchNorm2d-299            [-1, 672, 7, 7]           1,344
            ReLU-300            [-1, 672, 7, 7]               0
          Conv2d-301            [-1, 128, 7, 7]          86,016
     BatchNorm2d-302            [-1, 128, 7, 7]             256
            ReLU-303            [-1, 128, 7, 7]               0
          Conv2d-304             [-1, 32, 7, 7]          36,864
     BatchNorm2d-305            [-1, 704, 7, 7]           1,408
            ReLU-306            [-1, 704, 7, 7]               0
          Conv2d-307            [-1, 128, 7, 7]          90,112
     BatchNorm2d-308            [-1, 128, 7, 7]             256
            ReLU-309            [-1, 128, 7, 7]               0
          Conv2d-310             [-1, 32, 7, 7]          36,864
     BatchNorm2d-311            [-1, 736, 7, 7]           1,472
            ReLU-312            [-1, 736, 7, 7]               0
          Conv2d-313            [-1, 128, 7, 7]          94,208
     BatchNorm2d-314            [-1, 128, 7, 7]             256
            ReLU-315            [-1, 128, 7, 7]               0
          Conv2d-316             [-1, 32, 7, 7]          36,864
     BatchNorm2d-317            [-1, 768, 7, 7]           1,536
            ReLU-318            [-1, 768, 7, 7]               0
          Conv2d-319            [-1, 128, 7, 7]          98,304
     BatchNorm2d-320            [-1, 128, 7, 7]             256
            ReLU-321            [-1, 128, 7, 7]               0
          Conv2d-322             [-1, 32, 7, 7]          36,864
     BatchNorm2d-323            [-1, 800, 7, 7]           1,600
            ReLU-324            [-1, 800, 7, 7]               0
          Conv2d-325            [-1, 128, 7, 7]         102,400
     BatchNorm2d-326            [-1, 128, 7, 7]             256
            ReLU-327            [-1, 128, 7, 7]               0
          Conv2d-328             [-1, 32, 7, 7]          36,864
     BatchNorm2d-329            [-1, 832, 7, 7]           1,664
            ReLU-330            [-1, 832, 7, 7]               0
          Conv2d-331            [-1, 128, 7, 7]         106,496
     BatchNorm2d-332            [-1, 128, 7, 7]             256
            ReLU-333            [-1, 128, 7, 7]               0
          Conv2d-334             [-1, 32, 7, 7]          36,864
     BatchNorm2d-335            [-1, 864, 7, 7]           1,728
            ReLU-336            [-1, 864, 7, 7]               0
          Conv2d-337            [-1, 128, 7, 7]         110,592
     BatchNorm2d-338            [-1, 128, 7, 7]             256
            ReLU-339            [-1, 128, 7, 7]               0
          Conv2d-340             [-1, 32, 7, 7]          36,864
     BatchNorm2d-341            [-1, 896, 7, 7]           1,792
            ReLU-342            [-1, 896, 7, 7]               0
          Conv2d-343            [-1, 128, 7, 7]         114,688
     BatchNorm2d-344            [-1, 128, 7, 7]             256
            ReLU-345            [-1, 128, 7, 7]               0
          Conv2d-346             [-1, 32, 7, 7]          36,864
     BatchNorm2d-347            [-1, 928, 7, 7]           1,856
            ReLU-348            [-1, 928, 7, 7]               0
          Conv2d-349            [-1, 128, 7, 7]         118,784
     BatchNorm2d-350            [-1, 128, 7, 7]             256
            ReLU-351            [-1, 128, 7, 7]               0
          Conv2d-352             [-1, 32, 7, 7]          36,864
     BatchNorm2d-353            [-1, 960, 7, 7]           1,920
            ReLU-354            [-1, 960, 7, 7]               0
          Conv2d-355            [-1, 128, 7, 7]         122,880
     BatchNorm2d-356            [-1, 128, 7, 7]             256
            ReLU-357            [-1, 128, 7, 7]               0
          Conv2d-358             [-1, 32, 7, 7]          36,864
     BatchNorm2d-359            [-1, 992, 7, 7]           1,984
            ReLU-360            [-1, 992, 7, 7]               0
          Conv2d-361            [-1, 128, 7, 7]         126,976
     BatchNorm2d-362            [-1, 128, 7, 7]             256
            ReLU-363            [-1, 128, 7, 7]               0
          Conv2d-364             [-1, 32, 7, 7]          36,864
     BatchNorm2d-365           [-1, 1024, 7, 7]           2,048
          Linear-366                  [-1, 512]         524,800
            ReLU-367                  [-1, 512]               0
         Dropout-368                  [-1, 512]               0
          Linear-369                  [-1, 256]         131,328
            ReLU-370                  [-1, 256]               0
         Dropout-371                  [-1, 256]               0
          Linear-372                    [-1, 2]             514
      LogSoftmax-373                    [-1, 2]               0
================================================================
Total params: 7,610,498
Trainable params: 7,610,498
Non-trainable params: 0
----------------------------------------------------------------
Input size (MB): 0.68
Forward/backward pass size (MB): 341.21
Params size (MB): 29.03
Estimated Total Size (MB): 370.92
----------------------------------------------------------------

```
</details>

### Related Papers

- [Machine Learning Attacks Against the Asirra CAPTCHA](http://xenon.stanford.edu/~pgolle/papers/dogcat.pdf)
- [Densely Connected Convolutional Networks](https://arxiv.org/abs/1608.06993)
- [An Optical Frontend for a Convolutional Neural Network](https://arxiv.org/pdf/1901.03661.pdf)

### Team

- [Amitrajit Bose](https://www.linkedin.com/in/amitrajitbose/)

### Issues

Feel free to submit any issues.

### Contributions

Currently open to only issues and bug fix related PRs. Feel free to solve an issue and submit a PR.

