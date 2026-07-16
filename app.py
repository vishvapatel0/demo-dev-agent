from flask import Flask, jsonify, request

from calculator import divide
from greeting import greet

app = Flask(__name__)


@app.route("/health")
def health_route():
    return jsonify({"status": "ok"}), 200


@app.route("/greet")
def greet_route():
    name = request.args.get("name", "")
    return jsonify({"message": greet(name)})


@app.route("/calc/divide")
def divide_route():
    a = float(request.args.get("a", "0"))
    b = float(request.args.get("b", "0"))
    return jsonify({"result": divide(a, b)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
