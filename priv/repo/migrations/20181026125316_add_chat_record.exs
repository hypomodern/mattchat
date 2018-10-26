defmodule Mattchat.Repo.Migrations.AddChatRecord do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add :body, :string, null: false
      add :channel, :string, null: false
      add :user_id, references(:users, on_delete: :nilify_all)

      timestamps()
    end

    create index(:messages, [:channel])
    create index(:messages, [:user_id])
  end
end
