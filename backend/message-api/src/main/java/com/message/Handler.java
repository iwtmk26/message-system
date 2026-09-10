package com.message;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

public class Handler
        implements RequestHandler<Map<String, Object>, String> {

    @Override
    public String handleRequest(
            Map<String, Object> input,
            Context context) {

        String routeKey =
                String.valueOf(input.get("routeKey"));

        /*
         * ============================
         * GET /members
         * ============================
         */
        if ("GET /members".equals(routeKey)) {

            return getMembers();

        }

        /*
         * ============================
         * GET /messages
         * ============================
         */
        if ("GET /messages".equals(routeKey)) {

            return getMessages();

        }

        /*
         * ============================
         * GET /messages/{messageId}
         * ============================
         */
        if ("GET /messages/{messageId}".equals(routeKey)) {

            return getMessageById(input);

        }

        /*
         * ============================
         * DELETE /messages
         * ============================
         */
        if ("DELETE /messages".equals(routeKey)) {

            return deleteMessage(input);

        }

        /*
         * ============================
         * POST /messages
         * ============================
         */
        if ("POST /messages".equals(routeKey)) {

            try {

                ObjectMapper mapper =
                        new ObjectMapper();

                MessageRequest request =
                        mapper.readValue(
                                String.valueOf(
                                        input.get("body")
                                ),
                                MessageRequest.class
                        );

                DynamoDbClient dynamoDb =
                        DynamoDbClient.builder()
                                .region(
                                        Region.AP_NORTHEAST_1
                                )
                                .build();

                Map<String, AttributeValue> item =
                        new HashMap<>();

                /*
                 * messageId
                 */
                item.put(
                        "messageId",
                        AttributeValue.builder()
                                .s(
                                        UUID.randomUUID()
                                                .toString()
                                )
                                .build()
                );

                /*
                 * messageBody
                 */
                item.put(
                        "messageBody",
                        AttributeValue.builder()
                                .s(
                                        request.getMessageBody()
                                )
                                .build()
                );

                /*
                 * receiverName
                 */
                item.put(
                        "receiverName",
                        AttributeValue.builder()
                                .s(
                                        request.getReceiverName()
                                )
                                .build()
                );

                /*
                 * destination
                 */
                item.put(
                        "destination",
                        AttributeValue.builder()
                                .s(
                                        request.getDestination()
                                )
                                .build()
                );

                /*
                 * registeredAt
                 */
                String registeredAt =
                        LocalDateTime.now(
                                ZoneId.of("Asia/Tokyo")
                        ).format(
                                DateTimeFormatter.ofPattern(
                                        "yyyy/MM/dd HH:mm:ss"
                                )
                        );

                item.put(
                        "registeredAt",
                        AttributeValue.builder()
                                .s(registeredAt)
                                .build()
                );

                /*
                 * DynamoDBへ保存
                 */
                PutItemRequest putItemRequest =
                        PutItemRequest.builder()
                                .tableName("Messages")
                                .item(item)
                                .build();

                dynamoDb.putItem(
                        putItemRequest
                );

                /*
                 * メール送信
                 */
                sendEmail(request);

                return "SUCCESS";

            } catch (Exception e) {

                e.printStackTrace();

                return e.getClass().getName()
                        + " : "
                        + e.getMessage();

            }

        }

        /*
         * ============================
         * 未定義のルート
         * ============================
         */
        return "Unknown route: " + routeKey;

    }

    /*
     * ==========================================
     * メンバー一覧取得
     * ==========================================
     */
    private String getMembers() {

        DynamoDbClient dynamoDb =
                DynamoDbClient.builder()
                        .region(
                                Region.AP_NORTHEAST_1
                        )
                        .build();

        /*
         * Members取得
         */
        ScanResponse membersResponse =
                dynamoDb.scan(
                        ScanRequest.builder()
                                .tableName("Members")
                                .build()
                );

        /*
         * Messages取得
         */
        ScanResponse messagesResponse =
                dynamoDb.scan(
                        ScanRequest.builder()
                                .tableName("Messages")
                                .build()
                );

        /*
         * 伝言先ごとの件数
         */
        Map<String, Integer> countMap =
                new HashMap<>();

        for (
                Map<String, AttributeValue> item
                : messagesResponse.items()
        ) {

            String destination =
                    item.get("destination").s();

            countMap.put(
                    destination,
                    countMap.getOrDefault(
                            destination,
                            0
                    ) + 1
            );

        }

        /*
         * メンバー一覧
         */
        List<Map<String, String>> members =
                new ArrayList<>();

        for (
                Map<String, AttributeValue> item
                : membersResponse.items()
        ) {

            Map<String, String> member =
                    new HashMap<>();

            /*
             * memberId
             */
            member.put(
                    "memberId",
                    item.get("memberId").s()
            );

            /*
             * memberName
             */
            member.put(
                    "memberName",
                    item.get("memberName").s()
            );

            /*
             * displayName
             */
            if (item.containsKey("displayName")) {

                member.put(
                        "displayName",
                        item.get("displayName").s()
                );

            }

            members.add(member);

        }

        /*
         * 伝言先として使用された回数が多い順
         */
        Collections.sort(
                members,
                new Comparator<Map<String, String>>() {

                    @Override
                    public int compare(
                            Map<String, String> a,
                            Map<String, String> b) {

                        int countA =
                                countMap.getOrDefault(
                                        a.get("memberName"),
                                        0
                                );

                        int countB =
                                countMap.getOrDefault(
                                        b.get("memberName"),
                                        0
                                );

                        return Integer.compare(
                                countB,
                                countA
                        );

                    }

                }
        );

        try {

            ObjectMapper mapper =
                    new ObjectMapper();

            return mapper.writeValueAsString(
                    members
            );

        } catch (Exception e) {

            throw new RuntimeException(e);

        }

    }

    /*
     * ==========================================
     * 伝言一覧取得
     * ==========================================
     */
    private String getMessages() {

        DynamoDbClient dynamoDb =
                DynamoDbClient.builder()
                        .region(
                                Region.AP_NORTHEAST_1
                        )
                        .build();

        ScanRequest scanRequest =
                ScanRequest.builder()
                        .tableName("Messages")
                        .build();

        ScanResponse response =
                dynamoDb.scan(scanRequest);

        List<Map<String, String>> messages =
                new ArrayList<>();

        for (
                Map<String, AttributeValue> item
                : response.items()
        ) {

            Map<String, String> message =
                    new HashMap<>();

            message.put(
                    "messageId",
                    item.get("messageId").s()
            );

            message.put(
                    "messageBody",
                    item.get("messageBody").s()
            );

            message.put(
                    "receiverName",
                    item.get("receiverName").s()
            );

            message.put(
                    "destination",
                    item.get("destination").s()
            );

            message.put(
                    "registeredAt",
                    item.get("registeredAt").s()
            );

            messages.add(message);

        }

        /*
         * 新しい伝言を上にする
         */
        Collections.sort(
                messages,
                new Comparator<Map<String, String>>() {

                    @Override
                    public int compare(
                            Map<String, String> a,
                            Map<String, String> b) {

                        return b.get("registeredAt")
                                .compareTo(
                                        a.get("registeredAt")
                                );

                    }

                }
        );

        /*
         * 最大50件
         */
        if (messages.size() > 50) {

            messages =
                    new ArrayList<>(
                            messages.subList(
                                    0,
                                    50
                            )
                    );

        }

        try {

            ObjectMapper mapper =
                    new ObjectMapper();

            return mapper.writeValueAsString(
                    messages
            );

        } catch (Exception e) {

            throw new RuntimeException(e);

        }

    }

    /*
     * ==========================================
     * 伝言詳細取得
     *
     * GET /messages/{messageId}
     * ==========================================
     */
    private String getMessageById(
            Map<String, Object> input) {

        try {

            /*
             * pathParameters取得
             */
            Map<String, Object> pathParameters =
                    (Map<String, Object>)
                            input.get(
                                    "pathParameters"
                            );

            if (pathParameters == null) {

                return "NOT_FOUND";

            }

            String messageId =
                    String.valueOf(
                            pathParameters.get(
                                    "messageId"
                            )
                    );

            /*
             * messageIdチェック
             */
            if (
                    messageId == null
                    || messageId.isEmpty()
                    || "null".equals(messageId)
            ) {

                return "NOT_FOUND";

            }

            DynamoDbClient dynamoDb =
                    DynamoDbClient.builder()
                            .region(
                                    Region.AP_NORTHEAST_1
                            )
                            .build();

            /*
             * DynamoDBのキー
             */
            Map<String, AttributeValue> key =
                    new HashMap<>();

            key.put(
                    "messageId",
                    AttributeValue.builder()
                            .s(messageId)
                            .build()
            );

            /*
             * GetItem
             */
            GetItemRequest request =
                    GetItemRequest.builder()
                            .tableName("Messages")
                            .key(key)
                            .build();

            GetItemResponse response =
                    dynamoDb.getItem(request);

            /*
             * データが存在しない
             */
            if (
                    !response.hasItem()
                    || response.item().isEmpty()
            ) {

                return "NOT_FOUND";

            }

            Map<String, AttributeValue> item =
                    response.item();

            /*
             * フロントへ返すデータ
             */
            Map<String, String> message =
                    new HashMap<>();

            message.put(
                    "messageId",
                    item.get("messageId").s()
            );

            message.put(
                    "messageBody",
                    item.get("messageBody").s()
            );

            message.put(
                    "receiverName",
                    item.get("receiverName").s()
            );

            message.put(
                    "destination",
                    item.get("destination").s()
            );

            message.put(
                    "registeredAt",
                    item.get("registeredAt").s()
            );

            ObjectMapper mapper =
                    new ObjectMapper();

            return mapper.writeValueAsString(
                    message
            );

        } catch (Exception e) {

            e.printStackTrace();

            return e.getClass().getName()
                    + " : "
                    + e.getMessage();

        }

    }

    /*
     * ==========================================
     * 伝言削除
     * ==========================================
     */
    private String deleteMessage(
            Map<String, Object> input) {

        try {

            Map<String, Object> queryParams =
                    (Map<String, Object>)
                            input.get(
                                    "queryStringParameters"
                            );

            if (queryParams == null) {

                return "messageId is required";

            }

            String messageId =
                    String.valueOf(
                            queryParams.get(
                                    "messageId"
                            )
                    );

            if (
                    messageId == null
                    || messageId.isEmpty()
                    || "null".equals(messageId)
            ) {

                return "messageId is required";

            }

            DynamoDbClient dynamoDb =
                    DynamoDbClient.builder()
                            .region(
                                    Region.AP_NORTHEAST_1
                            )
                            .build();

            Map<String, AttributeValue> key =
                    new HashMap<>();

            key.put(
                    "messageId",
                    AttributeValue.builder()
                            .s(messageId)
                            .build()
            );

            DeleteItemRequest request =
                    DeleteItemRequest.builder()
                            .tableName("Messages")
                            .key(key)
                            .build();

            dynamoDb.deleteItem(
                    request
            );

            return "SUCCESS";

        } catch (Exception e) {

            return e.getClass().getName()
                    + " : "
                    + e.getMessage();

        }

    }

    /*
     * ==========================================
     * 受電者の送信元メール情報取得
     * ==========================================
     */
    private Map<String, String> getMemberSenderInfo(
            String receiverName) {

        DynamoDbClient dynamoDb =
                DynamoDbClient.builder()
                        .region(
                                Region.AP_NORTHEAST_1
                        )
                        .build();

        Map<String, AttributeValue> expressionValues =
                new HashMap<>();

        expressionValues.put(
                ":memberName",
                AttributeValue.builder()
                        .s(receiverName)
                        .build()
        );

        ScanRequest scanRequest =
                ScanRequest.builder()
                        .tableName("Members")
                        .filterExpression(
                                "memberName = :memberName"
                        )
                        .expressionAttributeValues(
                                expressionValues
                        )
                        .build();

        ScanResponse response =
                dynamoDb.scan(scanRequest);

        if (response.items().isEmpty()) {

            return Collections.emptyMap();

        }

        Map<String, AttributeValue> item =
                response.items().get(0);

        Map<String, String> info =
                new HashMap<>();

        /*
         * fromEmail
         */
        if (item.containsKey("fromEmail")) {

            info.put(
                    "fromEmail",
                    item.get("fromEmail").s()
            );

        }

        /*
         * displayName
         */
        if (item.containsKey("displayName")) {

            info.put(
                    "displayName",
                    item.get("displayName").s()
            );

        }

        return info;

    }

    /*
     * ==========================================
     * MIME表示名エンコード
     * ==========================================
     */
    private String encodeMimeDisplayName(
            String displayName) {

        try {

            byte[] bytes =
                    displayName.getBytes(
                            StandardCharsets.UTF_8
                    );

            String base64 =
                    Base64.getEncoder()
                            .encodeToString(bytes);

            return "=?UTF-8?B?"
                    + base64
                    + "?=";

        } catch (Exception e) {

            return displayName;

        }

    }

    /*
     * ==========================================
     * メール送信
     * ==========================================
     */
    private void sendEmail(
            MessageRequest request) {

        String defaultFromEmail =
                System.getenv("FROM_EMAIL");

        String defaultDisplayName =
                System.getenv(
                        "FROM_DISPLAY_NAME"
                );

        String teamsEmail =
                System.getenv("TEAMS_EMAIL");

        /*
         * 受電者に対応する送信元情報取得
         */
        Map<String, String> memberSenderInfo =
                getMemberSenderInfo(
                        request.getReceiverName()
                );

        /*
         * 送信元メールアドレス
         */
        String fromEmail =
                memberSenderInfo.getOrDefault(
                        "fromEmail",
                        defaultFromEmail
                );

        /*
         * 表示名
         */
        String displayName =
                memberSenderInfo.getOrDefault(
                        "displayName",
                        defaultDisplayName
                );

        String source =
                fromEmail;

        if (
                displayName != null
                && !displayName.isEmpty()
        ) {

            source =
                    encodeMimeDisplayName(
                            displayName
                    )
                    + " <"
                    + fromEmail
                    + ">";

        }

        System.out.println(
                "fromEmail=" + fromEmail
        );

        System.out.println(
                "displayName=" + displayName
        );

        System.out.println(
                "source=" + source
        );

        SesClient sesClient =
                SesClient.builder()
                        .region(
                                Region.AP_NORTHEAST_1
                        )
                        .build();

        String body =
                "伝言先: "
                + request.getDestination()
                + "\n"
                + "受電者: "
                + request.getReceiverName()
                + "\n\n"
                + "伝言内容\n"
                + "------------------\n"
                + request.getMessageBody();

        SendEmailRequest sendEmailRequest =
                SendEmailRequest.builder()
                        .source(source)
                        .destination(
                                Destination.builder()
                                        .toAddresses(
                                                teamsEmail
                                        )
                                        .build()
                        )
                        .message(
                                Message.builder()
                                        .subject(
                                                Content.builder()
                                                        .data(
                                                                "【電話伝言】"
                                                                + request.getDestination()
                                                                + " 宛"
                                                        )
                                                        .build()
                                        )
                                        .body(
                                                Body.builder()
                                                        .text(
                                                                Content.builder()
                                                                        .data(body)
                                                                        .build()
                                                        )
                                                        .build()
                                        )
                                        .build()
                        )
                        .build();

        sesClient.sendEmail(
                sendEmailRequest
        );

    }

}