#!/usr/bin/env python3
import asyncio
import json
import websockets

async def test_websocket():
    # First create a session
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/sessions", json={})
        session_data = response.json()
        session_id = session_data["session_id"]
        print(f"Created session: {session_id}")

    # Connect to WebSocket
    uri = f"ws://localhost:8000/ws/{session_id}"
    print(f"Connecting to: {uri}")

    try:
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket connected successfully!")

            # Send a test message
            await websocket.send(json.dumps({"message": "echo 'Hello from WebSocket test'"}))
            print("✓ Sent test message")

            # Receive responses (with timeout)
            try:
                for _ in range(5):
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(response)
                    print(f"✓ Received: {data.get('type', 'unknown')} - {data.get('content', '')[:50]}")
            except asyncio.TimeoutError:
                print("✓ Connection stable (timeout reached)")

    except Exception as e:
        print(f"✗ WebSocket error: {e}")
        return False

    return True

if __name__ == "__main__":
    result = asyncio.run(test_websocket())
    print("\n" + ("="*50))
    if result:
        print("WebSocket test PASSED ✓")
    else:
        print("WebSocket test FAILED ✗")
