using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// ✅ Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");


// 🔥 READ FROM ENV (NO HARDCODE)
string connStr =
    $"server={Environment.GetEnvironmentVariable("DB_HOST")};" +
    $"port={Environment.GetEnvironmentVariable("DB_PORT")};" +
    $"user={Environment.GetEnvironmentVariable("DB_USER")};" +
    $"password={Environment.GetEnvironmentVariable("DB_PASSWORD")};" +
    $"database={Environment.GetEnvironmentVariable("DB_NAME")}";


// 🔥 DB CONNECTION WITH RETRY
MySqlConnection GetConnection()
{
    int retries = 10;

    while (retries > 0)
    {
        try
        {
            var conn = new MySqlConnection(connStr);
            conn.Open();
            Console.WriteLine("✅ MySQL Connected (.NET)");
            return conn;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ DB not ready: {ex.Message}");
            Thread.Sleep(3000);
            retries--;
        }
    }

    throw new Exception("❌ Unable to connect to DB after retries");
}


// 🟢 HEALTH
app.MapGet("/health", () =>
{
    return Results.Json(new { status = "OK", service = ".NET" });
});


// 🔵 GET USERS
app.MapGet("/users", () =>
{
    try
    {
        var users = new List<object>();

        using var conn = GetConnection();

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
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🟡 ADD USER
app.MapPost("/users", async (HttpRequest request) =>
{
    try
    {
        var data = await request.ReadFromJsonAsync<Dictionary<string, string>>();

        if (data == null || !data.ContainsKey("name") || string.IsNullOrWhiteSpace(data["name"]))
        {
            return Results.BadRequest(new { error = "Name is required" });
        }

        string name = data["name"];

        using var conn = GetConnection();

        var cmd = new MySqlCommand("INSERT INTO users (name) VALUES (@name)", conn);
        cmd.Parameters.AddWithValue("@name", name);
        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "User added" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🔴 DELETE USER
app.MapDelete("/users/{id}", (int id) =>
{
    try
    {
        using var conn = GetConnection();

        var cmd = new MySqlCommand("DELETE FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "Deleted" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🚀 RUN
app.Run("http://0.0.0.0:8004");