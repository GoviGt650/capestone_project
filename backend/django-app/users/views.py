from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User


def health(request):
    return JsonResponse({"status": "OK", "service": "Django"})


@csrf_exempt
def users(request):

    if request.method == "OPTIONS":
        response = JsonResponse({"message": "OK"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    if request.method == "GET":
        data = list(User.objects.values())
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        body = json.loads(request.body)
        user = User.objects.create(name=body["name"])
        return JsonResponse({"id": user.id, "name": user.name})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_user(request, user_id):
    if request.method == "DELETE":
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({"message": "Deleted"})
        except User.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)