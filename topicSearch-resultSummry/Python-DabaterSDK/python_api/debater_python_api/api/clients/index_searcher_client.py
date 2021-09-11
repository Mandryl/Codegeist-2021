# (C) Copyright IBM Corp. 2020.

import json
import logging
import datetime

from debater_python_api.api.clients.abstract_client import AbstractClient
from debater_python_api.api.sentence_level_index.client.elastic_search_sentence_res import ElasticSentencesSearchRes


class IndexServiceClient(AbstractClient):

    def __init__(self, apikey):
        AbstractClient.__init__(self, apikey)
        self.host = 'https://wiki-index.debater.res.ibm.com'
        self.endpoint = '/search/wiki18_v1/ln_document/andOfOrs?version=3.0'

    def run(self, query):
        # this ugly code is here because one of the fields the json object should contain is called "from",
        # however, this cannot be a name of a member in Python :(
        time_stamp_start = datetime.datetime.now().timestamp()
        query_dict = vars(query)
        query_dict["from"] = query_dict["start"]
        query_dict.pop("start")
        logging.info ("customer of api_key {}, submitted a query: {}".format(self.apikey, json.dumps(query_dict)))
        res = self.do_run(query_dict, endpoint=self.endpoint)
        results = ElasticSentencesSearchRes(res)
        time_stamp_end = datetime.datetime.now().timestamp()
        logging.info('index_searcher_client.run = {}ms.'.format(1000*(time_stamp_end - time_stamp_start)))
        return [sentence.cleanSentenceText.strip() for sentence in results.sentences]
