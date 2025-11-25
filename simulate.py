import requests
import time
import random
import statistics
import threading

API = "http://localhost:4000"

USERS = [
    ("user1", "pass123"),
    ("user2", "pass123"),
    ("user3", "pass123"),
    ("user4", "pass123"),
] #Usuarios ya registrados anteriormente

ROOM_ID = 11             # ID de la sala donde se haran pruebas (Sala_simulada)
MESSAGES_PER_USER = 20  # Mensajes por usuario simultáneo

GLOBAL_LATENCIES = []
latency_lock = threading.Lock()


# -------------------------------------------------------
# MEDIDOR DE LATENCIA
# -------------------------------------------------------

def measure(func, *args, **kwargs):
    t0 = time.perf_counter()
    resp = func(*args, **kwargs)
    t1 = time.perf_counter()

    latency_ms = (t1 - t0) * 1000

    with latency_lock:
        GLOBAL_LATENCIES.append(latency_ms)

    return resp


# -------------------------------------------------------
# FUNCIONES CONTRA EL BACKEND
# -------------------------------------------------------

def login(username, password):
    r = requests.post(f"{API}/auth/login", json={
        "username": username,
        "password": password,
    })
    r.raise_for_status()
    return r.json()["token"]


def send_message(token, room_id, content):
    r = requests.post(
        f"{API}/rooms/{room_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
        json={"content": content}
    )
    r.raise_for_status()
    return r.json()


# -------------------------------------------------------
# SIMULACIÓN POR USUARIO
# -------------------------------------------------------

def user_thread(username, password):
    print(f"[SIM] Login → {username}")
    token = measure(login, username, password)

    for i in range(MESSAGES_PER_USER):
        message = f"{username} msg {i}"

        measure(send_message, token, ROOM_ID, message)

        # tiempo entre mensajes
        time.sleep(random.uniform(0.05, 0.2))


# -------------------------------------------------------
# REPORTE FINAL
# -------------------------------------------------------

def report():
    print("\n=== 📊 RESULTADOS DE LA PRUEBA ===")

    if not GLOBAL_LATENCIES:
        print("No se registraron latencias.")
        return

    print(f"Total requests: {len(GLOBAL_LATENCIES)}")
    print(f"Min: {min(GLOBAL_LATENCIES):.2f} ms")
    print(f"Max: {max(GLOBAL_LATENCIES):.2f} ms")
    print(f"Promedio: {statistics.mean(GLOBAL_LATENCIES):.2f} ms")

    # percentiles
    sorted_lat = sorted(GLOBAL_LATENCIES)
    p95 = sorted_lat[int(0.95 * len(sorted_lat)) - 1]
    p99 = sorted_lat[int(0.99 * len(sorted_lat)) - 1]

    print(f"P95: {p95:.2f} ms")
    print(f"P99: {p99:.2f} ms")


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":
    print("=== Simulación de carga iniciada ===")

    threads = []

    for (u, p) in USERS:
        t = threading.Thread(target=user_thread, args=(u, p))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    report()
