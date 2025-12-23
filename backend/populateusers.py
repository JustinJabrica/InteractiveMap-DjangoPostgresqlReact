import requests

BASE_URL = "http://localhost:8000"
ENDPOINT = "/api/accounts/register/"


def create_user(user_number: int) -> dict:
    return {
        "username": f"user{user_number}",
        "email": f"user{user_number}@user.com",
        "password": "PassKey123",
        "password_confirm": "PassKey123",
        "first_name": "",
        "last_name": ""
    }


def populate_users(count: int = 100):
    url = f"{BASE_URL}{ENDPOINT}"
    successful = 0
    failed = 0

    for i in range(1, count + 1):
        payload = create_user(i)
        try:
            response = requests.post(url, json=payload)

            if response.status_code in (200, 201):
                print(f"✓ Created user{i}")
                successful += 1
            else:
                print(f"✗ Failed user{i}: {response.status_code} - {response.text}")
                failed += 1
        except requests.RequestException as e:
            print(f"✗ Error user{i}: {e}")
            failed += 1

    print(f"\nCompleted: {successful} created, {failed} failed")


if __name__ == "__main__":
    populate_users(100)