# wheat-pusher

### login

* login message format

example user_ids: a2b7c193f5df42a69942d0bc848c0467, a76b6e59c2c7470e93fb06abe97f9633

```
{
    "event": "login",
    "user_id": "a2b7c193f5df42a69942d0bc848c0467"
}
```

```
{
    "event": "login",
    "user_id": "a76b6e59c2c7470e93fb06abe97f9633"
}
```

### message

* chat message format

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
