# (C) Copyright IBM Corp. 2020.

from debater_python_api.api.debater_api import DebaterApi
from debater_python_api.api.sentence_level_index.client.sentence_query_base import SimpleQuery
from debater_python_api.api.sentence_level_index.client.sentence_query_request import SentenceQueryRequest

debater_api = DebaterApi ('PUT_YOUR_API_KEY_HERE')

index_searcher_client = debater_api.get_index_searcher_client()

query = SimpleQuery(is_ordered=False, window_size=10)
query.add_concept_element(['Wind power', 'Wind farm'])
query.add_normalized_element(['harnessing', 'batteries'])
query.add_type_element(['Sentiment'])
query_request = SentenceQueryRequest(query=query.get_sentence_query(), size=8, sentenceLength=(7, 60))

sentences = index_searcher_client.run(query_request)

for sentence in sentences:
    print(sentence)
