---
title: Psql, Python and Character Encoding
date: "2020-05-17T19:45:03.284Z"
description: UTF-8 is still not default
---


Seems like once a year something to do with character encoding slows down whatever I am working on. Exporting a
database table locally as a csv and processing it with python in this case.

Logged on to the databse with the `psql` command line tool we can copy a database table to our localhost with:

`\copy (SELECT * FROM my_table) TO '~/my_data.csv' WITH csv header ENCODING 'utf-8';`

Looks simple enough and it is but initially `ENCODING 'utf-8'` was not included. The text columns in the table *were*
UTF-8 encoded, however the psql client helpfully converts to our locale. On my Linux laptop that is also UTF-8.
What about Windows? Well python can tell us what it thinks is the preferred encoding:

```python
import locale
locale.getpreferredencoding()
```

`cp1252` which causes a bit of grief. Even with the data in UTF-8 by specifying the encoding to the `\copy` command
python will need some guidance.

```python
with open("my_data.csv", encoding="utf-8") as data_file:
    ... # process data in utf-8
```

Look forward to UTF-8 truly being everywhere.
