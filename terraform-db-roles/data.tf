data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "db_cluster_resource_id" {
  name = "/repo/${var.environment}/output/prm-deductions-${var.component_name}/db-resource-cluster-id"
}
