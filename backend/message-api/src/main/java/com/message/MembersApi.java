package com.message;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

/*
 * ==========================================
 * 社員の「非表示」（論理削除）の API
 *
 * PUT /members/{memberId}   body: {"retired": true | false}
 *   true : Members の該当の行に retired = true を付ける（選択肢から外れる）
 *   false: retired を取り除く（選択肢に戻る）
 * 行そのものは消さない。
 *
 * 他の伝言 API と違い、HTTP ステータスを正しく返す（200 / 400 / 404 / 500）。
 * 一覧（GET /members）は Handler にある。
 * ==========================================
 */
public class MembersApi {

    static final String ROUTE_UPDATE = "PUT /members/{memberId}";

    private static final String MEMBERS_TABLE =
            System.getenv().getOrDefault(
                    "MEMBERS_TABLE", "Members");

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static DynamoDbClient dynamo;

    private MembersApi() {
    }

    static boolean matches(String routeKey) {
        return ROUTE_UPDATE.equals(routeKey);
    }

    static Map<String, Object> handle(Map<String, Object> input) {

        try {

            String memberId = pathMemberId(input);

            Boolean retired = parseRetired(input.get("body"));

            return setRetired(memberId, retired);

        } catch (BadRequest e) {

            return response(400, message(e.getMessage()));

        } catch (Exception e) {

            e.printStackTrace();

            return response(500, message("サーバーでエラーが発生しました"));
        }
    }

    private static Map<String, Object> setRetired(
            String memberId,
            boolean retired) {

        Map<String, AttributeValue> key = new HashMap<>();

        key.put("memberId", AttributeValue.builder().s(memberId).build());

        UpdateItemRequest.Builder request =
                UpdateItemRequest.builder()
                        .tableName(MEMBERS_TABLE)
                        .key(key)
                        // 行がないのに、新しい行ができてしまわないように
                        .conditionExpression("attribute_exists(memberId)");

        if (retired) {

            Map<String, AttributeValue> values = new HashMap<>();

            values.put(":r", AttributeValue.builder().bool(true).build());

            request.updateExpression("SET retired = :r")
                    .expressionAttributeValues(values);

        } else {

            request.updateExpression("REMOVE retired");
        }

        try {

            client().updateItem(request.build());

        } catch (ConditionalCheckFailedException e) {

            return response(404, message("社員が見つかりません"));
        }

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("memberId", memberId);
        body.put("retired", retired);

        return response(200, body);
    }

    static String pathMemberId(Map<String, Object> input) {

        @SuppressWarnings("unchecked")
        Map<String, Object> params =
                (Map<String, Object>) input.get("pathParameters");

        Object id = params == null ? null : params.get("memberId");

        if (id == null || String.valueOf(id).trim().isEmpty()) {
            throw new BadRequest("社員の ID を指定してください");
        }

        return String.valueOf(id).trim();
    }

    /* body は {"retired": true/false} だけを受け付ける（真偽値以外は 400） */
    static Boolean parseRetired(Object raw) {

        if (raw == null) {
            throw new BadRequest("retired（true か false）を指定してください");
        }

        Map<String, Object> body;

        try {

            body = MAPPER.readValue(
                    String.valueOf(raw),
                    new TypeReference<Map<String, Object>>() { });

        } catch (Exception e) {

            throw new BadRequest("リクエストの形式が正しくありません");
        }

        Object retired = body.get("retired");

        if (!(retired instanceof Boolean)) {
            throw new BadRequest("retired（true か false）を指定してください");
        }

        return (Boolean) retired;
    }

    private static synchronized DynamoDbClient client() {

        if (dynamo == null) {

            dynamo = DynamoDbClient.builder()
                    .region(Region.AP_NORTHEAST_1)
                    .build();
        }

        return dynamo;
    }

    private static Map<String, String> message(String text) {

        Map<String, String> body = new LinkedHashMap<>();

        body.put("message", text);

        return body;
    }

    private static Map<String, Object> response(int status, Object body) {

        Map<String, Object> response = new LinkedHashMap<>();

        try {

            response.put("statusCode", status);

            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json; charset=utf-8");
            response.put("headers", headers);

            response.put("body", MAPPER.writeValueAsString(body));

        } catch (Exception e) {

            throw new RuntimeException(e);
        }

        return response;
    }

    static class BadRequest extends RuntimeException {

        BadRequest(String message) {
            super(message);
        }
    }
}
