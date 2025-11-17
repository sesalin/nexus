import os
import sys
import json
import time
import random
import logging
import shutil
from pathlib import Path

def load_options():
    p = os.getenv("OPTIONS_PATH", "/data/options.json")
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}
    images_path = Path(data.get("images_path", "/config/www/wp"))
    start_index = int(data.get("start_index", 1))
    end_index = int(data.get("end_index", 10))
    rotation_interval = int(data.get("rotation_interval", 300))
    mode = str(data.get("mode", "sequential")).lower()
    current_filename = str(data.get("current_filename", "current.png"))
    log_level = str(data.get("log_level", "info")).lower()
    return {
        "images_path": images_path,
        "start_index": start_index,
        "end_index": end_index,
        "rotation_interval": rotation_interval,
        "mode": mode,
        "current_filename": current_filename,
        "log_level": log_level,
    }

def setup_logging(level):
    mapping = {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warning": logging.WARNING,
        "error": logging.ERROR,
    }
    logging.basicConfig(level=mapping.get(level, logging.INFO), format="%(asctime)s %(levelname)s %(message)s")

def validate(opts):
    if opts["end_index"] < opts["start_index"]:
        logging.error("end_index menor que start_index")
        sys.exit(1)
    if not opts["images_path"].exists():
        logging.error("images_path no existe: %s", str(opts["images_path"]))
        sys.exit(1)

def indices_validos(opts):
    r = range(opts["start_index"], opts["end_index"] + 1)
    return [i for i in r if (opts["images_path"] / f"{i}.png").is_file()]

#def copiar_actual(opts, idx):
#    src = opts["images_path"] / f"{idx}.png"
#    dst = opts["images_path"] / opts["current_filename"]
#    shutil.copyfile(src, dst)

def copiar_actual(opts, idx):
    src = opts["images_path"] / f"{idx}.png"
    dst = opts["images_path"] / opts["current_filename"]

    try:
        # 1. borrar si existe (inode nuevo siempre)
        if dst.exists():
            dst.unlink()

        # 2. copiar con write nuevo
        with open(src, "rb") as fsrc, open(dst, "wb") as fdst:
            fdst.write(fsrc.read())

        # 3. asegurar timestamp modificado
        now = time.time()
        os.utime(dst, (now, now))

    except Exception as ex:
        logging.error("error al reemplazar current.png: %s", str(ex))
        raise


def siguiente_secuencial(opts, actual):
    s = opts["start_index"]
    e = opts["end_index"]
    if actual is None:
        return s
    n = actual + 1
    if n > e:
        n = s
    return n

def siguiente_aleatorio(opts, actual):
    s = opts["start_index"]
    e = opts["end_index"]
    if s == e:
        return s
    while True:
        n = random.randint(s, e)
        if n != actual:
            return n

def run():
    opts = load_options()
    setup_logging(opts["log_level"])
    validate(opts)
    validos = indices_validos(opts)
    actual = None
    if validos:
        actual = validos[0]
        try:
            copiar_actual(opts, actual)
        except Exception as ex:
            logging.error("error copiando imagen inicial: %s", str(ex))
    logging.info("ruta current: %s", str(opts["images_path"] / opts["current_filename"]))
    logging.info("modo: %s", opts["mode"]) 
    logging.info("intervalo: %s", str(opts["rotation_interval"]))
    logging.info("rango: %s..%s", str(opts["start_index"]), str(opts["end_index"]))
    while True:
        time.sleep(opts["rotation_interval"])
        if opts["mode"] == "sequential":
            idx = siguiente_secuencial(opts, actual)
        else:
            idx = siguiente_aleatorio(opts, actual)
        ruta = opts["images_path"] / f"{idx}.png"
        if not ruta.is_file():
            logging.warning("imagen no existe: %s", str(ruta))
            actual = idx
            continue
        try:
            copiar_actual(opts, idx)
            actual = idx
            logging.info("actualizada current a índice %s", str(idx))
        except Exception as ex:
            logging.error("error copiando imagen: %s", str(ex))

if __name__ == "__main__":
    run()