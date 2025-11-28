from django.shortcuts import render

def button_docs(request):
    return render(request, "docs/button.html")