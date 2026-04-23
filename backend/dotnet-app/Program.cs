using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

string connStr = builder.Configuration.GetConnectionString("DefaultConnection");

// Health
app.MapGet("/health", () =>
{
    return Results.Json(new { status = "OK", service = ".NET" });
});

// Get users
app.MapGet("/users", () =>
{
    var users = new List<object>();

    using var conn = new MySqlConnection(connStr);
    conn.Open();

    var cmd = new MySqlCommand("SELECT * FROM users", conn);
    var reader = cmd.ExecuteReader();

    while (reader.Read())
    {
        users.Add(new
        {
            id = reader.GetInt32("id"),
            name = reader.GetString("name")
        });
    }

    return Results.Json(users);
});

// Add user
app.MapPost("/users", async (HttpRequest request) =>
{
    var data = await request.ReadFromJsonAsync<dynamic>();
    string name = data.name;

    using var conn = new MySqlConnection(connStr);
    conn.Open();

    var cmd = new MySqlCommand("INSERT INTO users (name) VALUES (@name)", conn);
    cmd.Parameters.AddWithValue("@name", name);
    cmd.ExecuteNonQuery();

    return Results.Json(new { message = "User added" });
});

// Delete user
app.MapDelete("/users/{id}", (int id) =>
{
    using var conn = new MySqlConnection(connStr);
    conn.Open();

    var cmd = new MySqlCommand("DELETE FROM users WHERE id = @id", conn);
    cmd.Parameters.AddWithValue("@id", id);
    cmd.ExecuteNonQuery();

    return Results.Json(new { message = "Deleted" });
});

app.Run("http://0.0.0.0:8004");