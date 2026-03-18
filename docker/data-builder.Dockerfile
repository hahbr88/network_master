FROM python:3.12-alpine

WORKDIR /workspace

COPY requirements-data.txt /tmp/requirements-data.txt
RUN pip install --no-cache-dir -r /tmp/requirements-data.txt

CMD ["python", "scripts/build_exam_json.py"]
