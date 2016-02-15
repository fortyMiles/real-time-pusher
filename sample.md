# wheat-pusher

### login

* login message format

example user_ids: a2b7c193f5df42a69942d0bc848c0467, a76b6e59c2c7470e93fb06abe97f9633

user A
```
{
    "event": "login",
    "user_id": "a2b7c193f5df42a69942d0bc848c0467",
    "token": "80a93e3c435775c0dec28f6a2ebafa49"
}
```

user B
```
{
    "event": "login",
    "user_id": "a76b6e59c2c7470e93fb06abe97f9633",
    "token": "bc47eeae0a5112469514821e8409ba43"
}
```

### message

* chat message format

A -> B
```
{
    "event": "chat",
    "sub_event": "p2p",
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
    "event": "chat",
    "sub_event": "p2p",
    "sender_id": "a76b6e59c2c7470e93fb06abe97f9633",
    "receiver_id": "a2b7c193f5df42a69942d0bc848c0467",
    "content_type": "text",
    "content": {
        "text": "hello"
    }
}
```

group_id 8acfcf1705eb44b082e281f3efbc52a2

A -> group

```
{
    "event": "chat",
    "sub_event": "p2g",
    "sender_id": "a2b7c193f5df42a69942d0bc848c0467",
    "group_id": "8acfcf1705eb44b082e281f3efbc52a2",
    "content_type": "text",
    "content": {
        "text": "hello group"
    }
}
```

B -> group
```
{
    "event": "chat",
    "sub_event": "p2g",
    "sender_id": "0787ac6ad30b4bdeafc654a225eb96ba",
    "group_id": "8acfcf1705eb44b082e281f3efbc52a2",
    "content_type": "text",
    "content": {
        "text": "hello B"
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

### invitation

* invitee接受的invitation

```
{
    "event": "invitation",
    "sub_event": "sd_inv",
    "invitation_id": "zxsdatw53453453645adfas",
    "receiver_id": "a76b6e59c2c7470e93fb06abe97f9633",
    "message": {
      "inviter_avatar": "",
      "inviter_nickname": "whitefoxx",
      "invitee": "0787ac6ad30b4bdeafc654a225eb96ba",
      "group_name": "modern family",
      "group_avatar": "",
      "role": "mother",
      "message": "welcome my wife",
      "group_id": "8acfcf1705eb44b082e281f3efbc52a2",
      "inviter": "a2b7c193f5df42a69942d0bc848c0467"
    }
}
```

* inviter接受的invitation notification

```
{
  "receiver_id": "a2b7c193f5df42a69942d0bc848c0467",
  "invitation_id": "9285a07d0d9d49aab74fc3f6364604dc",
  "sub_event": "acc_inv_ntf",
  "event": "invitation"
}
```
