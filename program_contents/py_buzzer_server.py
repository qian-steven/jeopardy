import asyncio
import websockets

player_names = []
allowing_player_buzzes = False
game_websocket = None

async def handler(websocket):
    global game_websocket
    global allowing_player_buzzes
    global player_names

    while True:
        message = await websocket.recv()
        pieces = message.split(':')
        if len(pieces) != 2:
            print("invalid message received : " + message)
            continue
        message_type, message_content = pieces

        if (message_type == "announce_players"):
            print(f'setting player names : {message_content}')
            player_names = message_content.split(',')
            game_websocket = websocket
        elif (message_type == "test"):
            await websocket.send("test_response:" + message_content)
        elif (message_type == "allow_buzzes"):
            print(message)
            allowing_player_buzzes = True
        elif (message_type == "disallow_buzzes"):
            print(message)
            allowing_player_buzzes = False
        elif (message_type == "get_player_names"):
            # print(message)
            await websocket.send(f"player_names:{','.join(player_names)}")
        elif (message_type == "buzz" and message_content in player_names and allowing_player_buzzes == True):
            allowing_player_buzzes = False
            print(message)
            await game_websocket.send(f"buzz:{message_content}")
        else:
            print("message ignored : " + message)


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future() # run forever

def run_main():
    asyncio.run(main())

if __name__ == "__main__":
    run_main()
