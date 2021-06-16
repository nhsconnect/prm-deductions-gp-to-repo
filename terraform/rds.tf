resource "aws_rds_cluster" "gp_to_repo_db_cluster" {
  cluster_identifier      = "${var.environment}-gp-to-repo-db-cluster"
  engine                  = "aurora-postgresql"
  database_name           = "gptorepodb"
  master_username         = data.aws_ssm_parameter.db-username.value
  master_password         = data.aws_ssm_parameter.db-password.value
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  vpc_security_group_ids  = [aws_security_group.gp-to-repo-db-sg.id]
  apply_immediately       = true
  db_subnet_group_name    = aws_db_subnet_group.gp_to_repo_db_cluster_subnet_group.name
  skip_final_snapshot = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.gp_to_repo_key.arn

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_kms_key" "gp_to_repo_key" {
  description             = "Gp To Repo KMS key in ${var.environment} environment"
  tags = {
    Name = "${var.environment}-gp-to-repo-db"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "gp_to_repo_rds_endpoint" {
  name = "/repo/${var.environment}/output/${var.repo_name}/gp-to-repo-rds-endpoint"
  type = "String"
  value = aws_rds_cluster.gp_to_repo_db_cluster.endpoint
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "gp_to_repo_db_cluster_subnet_group" {
  name       = "${var.environment}-gp-to-repo-db-subnet-group"
  subnet_ids = var.deductions_private_database_subnets

  tags = {
    Name = "${var.environment}-gp-to-repo-db-subnet-group"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "gp_to_repo_db_instances" {
  count                 = 1
  identifier            = "${var.environment}-gp-to-repo-db-instance-${count.index}"
  cluster_identifier    = aws_rds_cluster.gp_to_repo_db_cluster.id
  instance_class        = "db.t3.medium"
  engine                = "aurora-postgresql"
  db_subnet_group_name  = aws_db_subnet_group.gp_to_repo_db_cluster_subnet_group.name

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "gp-to-repo-db-sg" {
  name        = "${var.environment}-gp-to-repo-db-sg"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  ingress {
    description     = "Allow traffic from gp-to-repo to the db"
    protocol        = "tcp"
    from_port       = "5432"
    to_port         = "5432"
    security_groups = [aws_security_group.ecs-tasks-sg.id]
  }

  tags = {
    Name = "${var.environment}-state-db-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}







