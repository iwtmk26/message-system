package com.message;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

/*
 * ==========================================
 * 迷惑番号リストの API
 *
 * GET    /nuisance                       一覧
 * GET    /nuisance/{phoneNumber}         1件（番号検索）
 * POST   /nuisance                       登録
 * PUT    /nuisance/{phoneNumber}         編集（会社名・メモ）
 * DELETE /nuisance/{phoneNumber}         削除
 * POST   /nuisance/{phoneNumber}/logs    着信ログの追加
 *
 * 他の API と違い、HTTP ステータスを正しく返す
 * （200 / 201 / 400 / 404 / 409 / 500）。
 * ==========================================
 */
public class NuisanceApi {

    static final String ROUTE_PREFIX = "/nuisance";

    private static final String NUISANCE_TABLE =
            System.getenv().getOrDefault(
                    "NUISANCE_TABLE", "NuisanceNumbers");

    private static final int MIN_DIGITS = 8;
    private static final int MAX_DIGITS = 15;

    private static final Pattern DIGITS_ONLY =
            Pattern.compile("^[0-9]{" + MIN_DIGITS + "," + MAX_DIGITS + "}$");

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final DynamoDbClient DYNAMO =
            DynamoDbClient.builder()
                    .region(Region.AP_NORTHEAST_1)
                    .build();

    private NuisanceApi() {
    }

    /* routeKey の「/nuisance」以降の部分かどうか */
    static boolean matches(String routeKey) {

        int space = routeKey.indexOf(' ');

        if (space < 0) {
            return false;
        }

        String path = routeKey.substring(space + 1);

        return path.equals(ROUTE_PREFIX)
                || path.startsWith(ROUTE_PREFIX + "/");
    }

    static Map<String, Object> handle(
            String routeKey,
            Map<String, Object> input) {

        try {

            switch (routeKey) {

                case "GET /nuisance":
                    return list();

                case "GET /nuisance/{phoneNumber}":
                    return get(pathPhone(input));

                case "POST /nuisance":
                    return create(body(input));

                case "PUT /nuisance/{phoneNumber}":
                    return update(pathPhone(input), body(input));

                case "DELETE /nuisance/{phoneNumber}":
                    return delete(pathPhone(input));

                case "POST /nuisance/{phoneNumber}/logs":
                    return addLog(pathPhone(input), body(input));

                default:
                    return response(404, message("Unknown route: " + routeKey));
            }

        } catch (BadRequest e) {

            return response(400, message(e.getMessage()));

        } catch (Exception e) {

            e.printStackTrace();

            return response(500, message("サーバーでエラーが発生しました"));
        }
    }

    /*
     * ==========================================
     * 各処理
     * ==========================================
     */

    private static Map<String, Object> list() throws Exception {

        List<Map<String, Object>> items = new ArrayList<>();

        Map<String, AttributeValue> lastKey = null;

        do {

            ScanRequest.Builder request =
                    ScanRequest.builder().tableName(NUISANCE_TABLE);

            if (lastKey != null) {
                request.exclusiveStartKey(lastKey);
            }

            var result = DYNAMO.scan(request.build());

            for (Map<String, AttributeValue> item : result.items()) {
                items.add(toJson(item));
            }

            lastKey = result.hasLastEvaluatedKey()
                    ? result.lastEvaluatedKey()
                    : null;

        } while (lastKey != null);

        return response(200, items);
    }

    private static Map<String, Object> get(String phone) {

        Map<String, AttributeValue> item = find(phone);

        if (item == null) {
            return response(404, message("登録されていません"));
        }

        return response(200, toJson(item));
    }

    private static Map<String, Object> create(Map<String, Object> body) {

        String phone = validPhone(normalizePhone(text(body, "phoneNumber")));

        String now = nowJst();

        List<AttributeValue> logs = new ArrayList<>();

        if (Boolean.TRUE.equals(body.get("recordCall"))) {
            logs.add(logValue(now, text(body, "receiverName"), ""));
        }

        Map<String, AttributeValue> item = new HashMap<>();

        item.put("phoneNumber", s(phone));
        item.put("companyName", s(text(body, "companyName").trim()));
        item.put("memo", s(text(body, "memo").trim()));
        item.put("registeredAt", s(now));
        item.put("logs", AttributeValue.builder().l(logs).build());

        try {

            DYNAMO.putItem(
                    PutItemRequest.builder()
                            .tableName(NUISANCE_TABLE)
                            .item(item)
                            .conditionExpression(
                                    "attribute_not_exists(phoneNumber)")
                            .build());

        } catch (ConditionalCheckFailedException e) {

            return response(409, message("この番号はすでに登録されています"));
        }

        return response(201, toJson(item));
    }

    private static Map<String, Object> update(
            String phone, Map<String, Object> body) {

        Map<String, AttributeValue> values = new HashMap<>();

        values.put(":c", s(text(body, "companyName").trim()));
        values.put(":m", s(text(body, "memo").trim()));

        try {

            DYNAMO.updateItem(
                    UpdateItemRequest.builder()
                            .tableName(NUISANCE_TABLE)
                            .key(key(phone))
                            .updateExpression(
                                    "SET companyName = :c, memo = :m")
                            .conditionExpression(
                                    "attribute_exists(phoneNumber)")
                            .expressionAttributeValues(values)
                            .build());

        } catch (ConditionalCheckFailedException e) {

            return response(404, message("登録されていません"));
        }

        return response(200, toJson(find(phone)));
    }

    private static Map<String, Object> delete(String phone) {

        DYNAMO.deleteItem(
                DeleteItemRequest.builder()
                        .tableName(NUISANCE_TABLE)
                        .key(key(phone))
                        .build());

        return response(200, message("deleted"));
    }

    private static Map<String, Object> addLog(
            String phone, Map<String, Object> body) {

        Map<String, AttributeValue> values = new HashMap<>();

        values.put(
                ":log",
                AttributeValue.builder()
                        .l(logValue(
                                nowJst(),
                                text(body, "receiverName").trim(),
                                text(body, "note").trim()))
                        .build());

        values.put(":empty", AttributeValue.builder().l(new ArrayList<>()).build());

        try {

            DYNAMO.updateItem(
                    UpdateItemRequest.builder()
                            .tableName(NUISANCE_TABLE)
                            .key(key(phone))
                            .updateExpression(
                                    "SET logs = list_append("
                                            + "if_not_exists(logs, :empty), :log)")
                            .conditionExpression(
                                    "attribute_exists(phoneNumber)")
                            .expressionAttributeValues(values)
                            .build());

        } catch (ConditionalCheckFailedException e) {

            return response(404, message("登録されていません"));
        }

        return response(200, toJson(find(phone)));
    }

    /*
     * ==========================================
     * 補助
     * ==========================================
     */

    /*
     * 電話番号の表記ゆれ対策（画面の normalizePhone と同じ規則）
     * 全角→半角、数字以外を除く、先頭が +81 なら 0 に直す
     */
    static String normalizePhone(String raw) {

        StringBuilder half = new StringBuilder();

        for (char c : raw.toCharArray()) {

            if (c >= '０' && c <= '９') {
                half.append((char) (c - 0xFEE0));
            } else if (c == '＋') {
                half.append('+');
            } else {
                half.append(c);
            }
        }

        String trimmed = half.toString().trim();

        String digits = trimmed.replaceAll("[^0-9]", "");

        if (trimmed.matches("^\\+\\s*81.*") && digits.startsWith("81")) {
            digits = "0" + digits.substring(2);
        }

        return digits;
    }

    private static String validPhone(String digits) {

        if (!DIGITS_ONLY.matcher(digits).matches()) {
            throw new BadRequest("電話番号の桁数を確認してください");
        }

        return digits;
    }

    private static String pathPhone(Map<String, Object> input) {

        @SuppressWarnings("unchecked")
        Map<String, Object> params =
                (Map<String, Object>) input.get("pathParameters");

        if (params == null || params.get("phoneNumber") == null) {
            throw new BadRequest("電話番号の桁数を確認してください");
        }

        return validPhone(
                normalizePhone(String.valueOf(params.get("phoneNumber"))));
    }

    private static Map<String, Object> body(Map<String, Object> input) {

        Object raw = input.get("body");

        if (raw == null) {
            return new HashMap<>();
        }

        try {

            return MAPPER.readValue(
                    String.valueOf(raw),
                    new TypeReference<Map<String, Object>>() { });

        } catch (Exception e) {

            throw new BadRequest("リクエストの形式が正しくありません");
        }
    }

    private static String text(Map<String, Object> body, String name) {

        Object value = body.get(name);

        return value == null ? "" : String.valueOf(value);
    }

    private static Map<String, AttributeValue> find(String phone) {

        GetItemResponse response =
                DYNAMO.getItem(
                        GetItemRequest.builder()
                                .tableName(NUISANCE_TABLE)
                                .key(key(phone))
                                .build());

        return response.hasItem() && !response.item().isEmpty()
                ? response.item()
                : null;
    }

    private static Map<String, AttributeValue> key(String phone) {

        Map<String, AttributeValue> key = new HashMap<>();

        key.put("phoneNumber", s(phone));

        return key;
    }

    private static AttributeValue s(String value) {

        return AttributeValue.builder().s(value).build();
    }

    private static AttributeValue logValue(
            String calledAt, String receiverName, String note) {

        Map<String, AttributeValue> log = new HashMap<>();

        log.put("calledAt", s(calledAt));
        log.put("receiverName", s(receiverName));
        log.put("note", s(note));

        return AttributeValue.builder().m(log).build();
    }

    private static String nowJst() {

        return LocalDateTime.now(ZoneId.of("Asia/Tokyo"))
                .format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
    }

    /* DynamoDB の1件を、画面が使う JSON の形にする */
    private static Map<String, Object> toJson(
            Map<String, AttributeValue> item) {

        Map<String, Object> json = new LinkedHashMap<>();

        json.put("phoneNumber", str(item, "phoneNumber"));
        json.put("companyName", str(item, "companyName"));
        json.put("memo", str(item, "memo"));
        json.put("registeredAt", str(item, "registeredAt"));

        List<Map<String, String>> logs = new ArrayList<>();

        if (item.containsKey("logs")) {

            for (AttributeValue log : item.get("logs").l()) {

                Map<String, String> entry = new LinkedHashMap<>();

                entry.put("calledAt", str(log.m(), "calledAt"));
                entry.put("receiverName", str(log.m(), "receiverName"));
                entry.put("note", str(log.m(), "note"));

                logs.add(entry);
            }
        }

        json.put("logs", logs);

        return json;
    }

    private static String str(
            Map<String, AttributeValue> item, String name) {

        AttributeValue value = item.get(name);

        return value == null || value.s() == null ? "" : value.s();
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

    private static class BadRequest extends RuntimeException {

        BadRequest(String message) {
            super(message);
        }
    }
}
