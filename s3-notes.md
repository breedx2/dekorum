
s3 notes
========

Some notes on s3 tools/usage.

To find the size of a bucket:

```
$ aws s3api list-objects --bucket BUCKET_NAME --output json --query "[sum(Contents[].Size), length(Contents[])]"
```

To find the size of all objects in a bucket given a prefix:

```
aws s3api list-objects --bucket BUCKET_NAME --prefix PREFIX --output json --query "[sum(Contents[].Size), length(Contents[])]"
```
