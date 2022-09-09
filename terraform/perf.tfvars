environment    = "perf"
component_name = "gp-to-repo"
dns_name       = "gp-to-repo"
repo_name      = "prm-deductions-gp-to-repo"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "0"

alb_deregistration_delay = 15

log_level = "info"

grant_access_through_vpn = true
enable_rds_cluster_deletion_protection = true

env_url_suffix = "non-prod.patient-deductions.nhs.uk"
db_instance_number = 3