---
description: How to format documentation correctly
---

**Our goal is to have a single .md file display well in both GitBook and GitHub**. To that end, we have to be careful about how we do things in the `.md` file. 

## Crazy GitBook things

GitBook disregards the top level header (`# Title`) in the `.md` file and instead will give that page the title defined in the `SUMMARY.md` file that determines the GitBook table of contents and file menu. In general, top level headers are not that critical, so best leave them out of the `.md` file unless you want pages in GitBook to have 2 different titles at the top.  

## Table of Contents 

The GitBook TOC and navigation, including order, is completely defined by the `SUMMARY.md` file. White space matters! To add a new entry to the TOC, add it to the `SUMMARY.md` file. 

## Headers

For all `.md` files, please a description header to the file:

```
---
description: How to format documentation correctly
---

# My Great Title <- do not do this unless you know what you are doing 

## Introduction

```

Note that the header must be right at the top of the file to work.

## Links

In general, please use 'full' paths to various files, like this:

```
[[examples]](../../boba_examples/boba-straw/README.md)
```

Note the use of `../../` - this is shorthand for the repo root, and will, remarkably, work both in GitBook and GitHub. You can also use relative links, such as `./boba-straw/README.md` but they will obviously break when the parent `README.md` file is moved. 

**Strange behavior**. There is no good way to provide a link to a folder. Please note that GitBook will auto-add `/README.md` to paths. So, for example, GitBook will autocomplete this path `../../boba_examples/boba-straw` to `../../boba_examples/boba-straw/README.md`, which is great if that file actually exists but otherwise will give you a 404 error (which is not great).

**Strange behavior**. Note that `/../../` is completely different than `../../`. The first one will not work universally, but `../../` will so please use that. 

## Images

Generally, all images for the documentation live in `./boba_documentation/.gitbook/assets`. To show an image in a documentation file, access it like this:

```

![turing](./packages/boba/gateway/src/images/boba2/turing.png)

```
