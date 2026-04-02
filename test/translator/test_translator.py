from unittest.mock import patch
from translator import client, query_llm_robust


@patch.object(client, 'chat')
def test_unexpected_language(mocker):
    mocker.return_value.message.content = "I don't understand your request"

    assert query_llm_robust("Hier ist dein erstes Beispiel.") == (True, "Hier ist dein erstes Beispiel.")


@patch.object(client, 'chat')
def test_unexpected_text_response(mocker):
    mocker.return_value.message.content = "INTERNAL_SERVER_ERROR: 500"

    result = query_llm_robust("Hier ist dein erstes Beispiel.")

    assert result == (True, "Hier ist dein erstes Beispiel.")


@patch.object(client, 'chat')
def test_empty_response(mocker):
    mocker.return_value.message.content = ""

    post = "Sample post for empty test"
    result = query_llm_robust(post)

    assert result == (True, post)


@patch.object(client, 'chat')
def test_nonsensical_long_response(mocker):
    mocker.return_value.message.content = (
        "Error: The model was unable to process this request due to a "
        "high volume of traffic and internal timeouts. Please try again later."
    )

    post = "Sample post for long error test"
    result = query_llm_robust(post)

    assert result == (True, post)


@patch.object(client, 'chat')
def test_chat_raises_connection_error(mocker):
    mocker.side_effect = ConnectionError("Could not reach Ollama service")

    post = "Ceci est un message en français"
    result = query_llm_robust(post)

    assert result == (True, post)


@patch.object(client, 'chat')
def test_language_model_generic_error(mocker):
    mocker.return_value.message.content = "An error occurred while processing your request."

    post = "Hola mundo"
    result = query_llm_robust(post)

    assert result == (True, post)


@patch.object(client, 'chat')
def test_normal_translation(mocker):
    mocker.return_value.message.content = '{"is_english": false, "translated_content": "This is a German message"}'

    result = query_llm_robust("Dies ist eine Nachricht auf Deutsch")

    assert result == (False, "This is a German message")


@patch.object(client, 'chat')
def test_english_input(mocker):
    mocker.return_value.message.content = '{"is_english": true, "translated_content": "Hello world"}'

    result = query_llm_robust("Hello world")

    assert result == (True, "Hello world")
