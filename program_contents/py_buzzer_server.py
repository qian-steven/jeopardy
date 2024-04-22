import asyncio
import websockets

player_names = []
allowing_player_buzzes = False
game_websocket = None
fastest_buzz_time = float('inf')
fastest_buzz_player = None

async def handler(websocket):
    global game_websocket
    global allowing_player_buzzes
    global player_names
    global fastest_buzz_time

    while True:
        message = await websocket.recv()

        # Expected messages delimited by : with two elements
        pieces = message.split(':')
        if len(pieces) not in (2, 3):
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
        elif (message_type == "buzz" and allowing_player_buzzes == True):
            # Got rid of this line 'and message_content in player_names'
            # Allow 1.5 second buffer to record the fastest buzz
            message_pieces = message_content.split(',')
            message_content, client_timestamp = message_pieces
            print(message_content)
            print(client_timestamp)
            client_timestamp = float(client_timestamp)
            if client_timestamp < fastest_buzz_time:
                fastest_buzz_time = client_timestamp
                await asyncio.sleep(1.5) # wait 1.5 seconds
                if fastest_buzz_time == client_timestamp:

                    # Send message and disallow buzzes once confirmed that current message is the fastest buzz
                    allowing_player_buzzes = False
                    print(message_content)
                    await game_websocket.send(f"buzz:{message_content}")

                    # Reset fastest buzz times and players
                    fastest_buzz_time = float('inf')
            print(message)
            # await game_websocket.send(f"buzz:{message_content}")
        else:
            print("message ignored : " + message)

# Start the websocket server
async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future() # run forever

# Run the server
def run_main():
    asyncio.run(main())

if __name__ == "__main__":
    run_main()
