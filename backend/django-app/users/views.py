from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User


# 🔥 Helper to add CORS headers everywhere
def cors(response):
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


# 🟢 Health
def health(request):
    return cors(JsonResponse({"status": "OK", "service": "Django"}))


# 🔵 Users API
@csrf_exempt
def users(request):

    # ✅ Handle preflight
    if request.method == "OPTIONS":
        return cors(JsonResponse({"message": "OK"}))

    # ✅ GET users
    if request.method == "GET":
        data = list(User.objects.values())
        return cors(JsonResponse(data, safe=False))

    # ✅ POST user
    elif request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8"))
            name = body.get("name")

            if not name:
                return cors(JsonResponse({"error": "Name required"}, status=400))

            user = User.objects.create(name=name)

            return cors(JsonResponse({"id": user.id, "name": user.name}))

        except Exception as e:
            return cors(JsonResponse({"error": str(e)}, status=400))

    return cors(JsonResponse({"error": "Method not allowed"}, status=405))


# 🔴 Delete user
@csrf_exempt
def delete_user(request, user_id):

    if request.method == "OPTIONS":
        return cors(JsonResponse({"message": "OK"}))

    if request.method == "DELETE":
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return cors(JsonResponse({"message": "Deleted"}))
        except User.DoesNotExist:
            return cors(JsonResponse({"error": "Not found"}, status=404))

    return cors(JsonResponse({"error": "Method not allowed"}, status=405))