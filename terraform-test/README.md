# テスト環境の Terraform

本番（`../terraform`）とは別の state。作る資源は `docs/環境分離設計.md` の表のとおり。

```
cd terraform-test
```

```
terraform init
```

```
terraform plan
```

`apply` は内容を確認してから担当者が実行する。state（`terraform.tfstate`）はこのフォルダにできる。**消さない・Git に入れない。**
