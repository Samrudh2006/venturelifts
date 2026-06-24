terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
  default     = "staging"
}

resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "aws_db_instance" "venturelift" {
  identifier        = "venturelift-${var.environment}"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  db_name           = "venturelift"
  username          = "venturelift"
  password          = random_password.db_password.result
  skip_final_snapshot = var.environment != "production"
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window     = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
  storage_encrypted = true
  tags = { Name = "venturelift-${var.environment}", Environment = var.environment }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "venturelift-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  tags = { Name = "venturelift-${var.environment}", Environment = var.environment }
}

resource "aws_ecs_cluster" "venturelift" {
  name = "venturelift-${var.environment}"
  tags = { Environment = var.environment }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "venturelift-app-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  container_definitions = jsonencode([
    {
      name  = "app"
      image = "venturelift/app:latest"
      portMappings = [{ containerPort = 8000, protocol = "tcp" }]
      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "DATABASE_URL", value = "postgresql://venturelift:${random_password.db_password.result}@${aws_db_instance.venturelift.address}:5432/venturelift" },
        { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/venturelift-${var.environment}"
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }
      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval = 30
        timeout  = 5
        retries  = 3
      }
    }
  ])
}

resource "aws_iam_role" "ecs_execution" {
  name = "venturelift-ecs-execution-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"]
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/venturelift-${var.environment}"
  retention_in_days = var.environment == "production" ? 90 : 30
}

output "database_endpoint" {
  value = aws_db_instance.venturelift.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
