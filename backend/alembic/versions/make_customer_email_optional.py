"""make_customer_email_optional

Revision ID: make_customer_email_optional
Revises: add_customers_module
Create Date: 2025-07-26 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'make_customer_email_optional'
down_revision = 'add_customers_module'
branch_labels = None
depends_on = None


def upgrade():
    # Tornar o email opcional
    op.alter_column('customers', 'email',
                    existing_type=sa.String(length=255),
                    nullable=True)


def downgrade():
    # Tornar o email obrigatório novamente
    op.alter_column('customers', 'email',
                    existing_type=sa.String(length=255),
                    nullable=False) 