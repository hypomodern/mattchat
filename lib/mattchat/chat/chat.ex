defmodule Mattchat.Chat do
  use Ecto.Schema
  import Ecto.Changeset


  schema "messages" do
    field :body, :string
    field :channel, :string
    belongs_to :user, Mattchat.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:body, :channel, :user_id])
    |> validate_required([:body, :channel, :user_id])
  end

end
