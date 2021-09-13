import os

try:
    import unzip_requirements
except ImportError:
    pass

import json
import logging
from dataclasses import dataclass
from logging import getLogger
from typing import List

from debater_python_api.api.clients.keypoints_client import KpAnalysisUtils
from debater_python_api.api.debater_api import DebaterApi

logger = getLogger()
logger.setLevel(logging.INFO)

debater_api = DebaterApi(os.environ.get("DEBATER_APIKEY"))
key_points_client = debater_api.get_keypoints_client()


@dataclass
class PostKeyPointRequest:
    texts: List[str]


def handle_key_points_analysis_request(event, context):
    # get body
    logger.info(f"event: {event}")
    payload = PostKeyPointRequest(**event)

    key_points = key_point_analyze(payload.texts)

    response = {
        "statusCode": 200,
        "body": json.dumps(key_points)
    }

    return response


def key_point_analyze(texts: List[str]) -> List[str]:
    """
    Do key point analyze with Project Debater API

    Args:
        texts: summary source text

    Returns:
        result: key point summaries
    """

    key_points = key_points_client.run(texts)
    KpAnalysisUtils.print_result(key_points)
    return key_points
