import unittest
from twitter_pay import parse_api_response

class TwitterPayAWSTest(unittest.TestCase):
  expected_sender_address = "4492b38f4c026d465e3d18a32d9677d6125668ce"
  expected_BT = "boba40294fb26"
  expected_author_id = "1475930621637799937"

  def test_get_request_params(self):
    from twitter_pay import get_request_params

    req_input = {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "0x836095883A9f1670025Ce8C730E75C304A6f009A",
      "params": [
        "0x00000000000000000000000000000000000000000000000000000000000000800000000000000000000000004492b38f4c026d465e3d18a32d9677d6125668ce000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000133135323631353438323532393732333539363800000000000000000000000000"]
    }
    (sender_address, twitter_post_id) = get_request_params(req_input)
    self.assertEqual(sender_address, self.expected_sender_address)
    self.assertEqual(twitter_post_id, "1526154825297235968")

  def test_parse_api_response(self):
    from twitter_pay import parse_api_response

    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB26'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 35, 'following_count': 54, 'tweet_count': 80, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(BT, self.expected_BT, "Boba bubble/tag invalid")
    self.assertEqual(is_allowed_to_claim, True)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 0, "Unexpected error")

  def test_parse_api_response_fail_different_sender(self):
    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB26'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 35, 'following_count': 54, 'tweet_count': 80, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address="4492b38f4c026d465e3d18a32d9677d6125668cf")
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 3, "Non expected error")
    self.assertNotEqual(BT, self.expected_BT, "Boba bubble/tag should not be valid")

  def test_parse_api_response_fail_invalid_tweet(self):
    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB27'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 35, 'following_count': 54, 'tweet_count': 80, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 3, "Non expected error")
    self.assertEqual(BT, self.expected_BT, "Boba bubble/tag invalid")

  def test_parse_api_response_fail_api_error(self):
    result = {'errors': {}, 'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB27'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 35, 'following_count': 54, 'tweet_count': 80, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, "0")
    self.assertEqual(error_reason, 1, "Non expected error")
    self.assertEqual(BT, "", "Boba bubble/tag should be empty")

  def test_parse_api_response_fail_not_enough_followers(self):
    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB26'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 4, 'following_count': 54, 'tweet_count': 80, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(BT, self.expected_BT, "Boba bubble/tag invalid")
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 4, "Non expected error")

  def test_parse_api_response_fail_not_enough_tweets(self):
    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB26'}, 'includes': {'users': [{'created_at': '2021-12-28T20:44:46.000Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 40, 'following_count': 54, 'tweet_count': 1, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(BT, self.expected_BT, "Boba bubble/tag invalid")
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 5, "Non expected error")

  def test_parse_api_response_fail_account_too_new(self):
    import datetime
    result = {'data': {'author_id': '1475930621637799937', 'id': '1526154825297235968', 'text': 'BOBA40294FB26'}, 'includes': {'users': [{'created_at': datetime.datetime.now().isoformat()+'Z', 'id': '1475930621637799937', 'username': 'Wavect_eth', 'name': 'Wavect.eth', 'public_metrics': {'followers_count': 40, 'following_count': 54, 'tweet_count': 17, 'listed_count': 5}}]}}

    (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=self.expected_sender_address)
    self.assertEqual(BT, self.expected_BT, "Boba bubble/tag invalid")
    self.assertEqual(is_allowed_to_claim, False)
    self.assertEqual(author_id, self.expected_author_id)
    self.assertEqual(error_reason, 2, "Non expected error")

  def test_build_resp_payload(self):
    from twitter_pay import build_resp_payload

    result = build_resp_payload(self.expected_BT, True, self.expected_author_id, 0)
    expected_result = "0x00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000147b8f149fd7b001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000626f6261343032393466623236"
    self.assertEqual(result, expected_result, "Turing result payload invalid")


if __name__ == '__main__':
  unittest.main()
