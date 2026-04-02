import json
from ollama import Client

client = Client(host='http://localhost:11434')

PROMPT_TEMPLATE = (
    'Determine if the following text is in English. '
    'If it is NOT English, translate it to English. '
    'Respond ONLY with a JSON object in this exact format: '
    '{{"is_english": true/false, "translated_content": "the text or translation"}}. '
    'Text: {content}'
)


def query_llm_robust(content: str) -> tuple:
    try:
        response = client.chat(
            model='llama3', # change to model you want to tests
            messages=[{
                'role': 'user',
                'content': PROMPT_TEMPLATE.format(content=content),
            }],
        )
        result = response.message.content.strip()
        if not result:
            return (True, content)

        parsed = json.loads(result)
        if (isinstance(parsed, dict)
                and 'is_english' in parsed
                and 'translated_content' in parsed):
            return (bool(parsed['is_english']), parsed['translated_content'])

        return (True, content)
    except (json.JSONDecodeError, KeyError, TypeError, AttributeError):
        return (True, content)
    except Exception:
        return (True, content)
