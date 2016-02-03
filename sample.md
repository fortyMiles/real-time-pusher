# wheat-pusher

### login

* login message format

example user_ids: a2b7c193f5df42a69942d0bc848c0467, a76b6e59c2c7470e93fb06abe97f9633

user A
```
{
    "event": "login",
    "user_id": "a2b7c193f5df42a69942d0bc848c0467"
}
```

user B
```
{
    "event": "login",
    "user_id": "a76b6e59c2c7470e93fb06abe97f9633"
}
```

### message

* chat message format

A -> B
```
{
    "event": "p2p",
    "sender_id": "a2b7c193f5df42a69942d0bc848c0467",
    "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
    "content_type": "text",
    "content": {
        "text": "hello"
    }
}
```

B -> A
```
{
    "event": "p2p",
    "sender_id": "a76b6e59c2c7470e93fb06abe97f9633",
    "receiver_id": "a2b7c193f5df42a69942d0bc848c0467",
    "content_type": "text",
    "content": {
        "text": "hello"
    }
}
```

* 返回单条

```
{
  "id": "17375d8ef11348b185b562e56a70d776",
  "sender_id": "a2b7c193f5df42a69942d0bc848c0467",
  "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
  "event": "p2p",
  "content_type": "text",
  "content": "{u'text': u'hello'}",
  "post_date": "2016-02-03T11:02:54.312089",
  "received": false
}
```

* 返回多条

```
{
  "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
  "messages": [
    {
      "id": "c1260394266246dcb41d0bf7c1a70aff",
      "sender_id": "a2b7c193f5df42a69942d0bc848c0467",
      "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
      "event": "p2p",
      "content_type": "text",
      "content": "{u'text': u'hello'}",
      "post_date": "2016-02-03T11:00:47",
      "received": false
    },
    {
      "id": "549f07789a244108bc972b272fb7e923",
      "sender_id": "a2b7c193f5df42a69942d0bc848c0467",
      "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
      "event": "p2p",
      "content_type": "text",
      "content": "{u'text': u'helladfao'}",
      "post_date": "2016-02-03T11:01:03",
      "received": false
    }
  ],
  "event": "get_unreceived_messages"
}
```

