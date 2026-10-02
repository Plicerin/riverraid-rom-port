-- MAME 0.287 lua capture script v6 (absolute minimum).
--
-- Previous iterations hit MAME 0.287 lua API walls:
--   - emu.register_frame_callback is nil (renamed to register_frame in 0.200+)
--   - manager:machine() fails (manager IS the running_machine in this build)
--   - machine global is nil
--   - ioport() method is nil on the running_machine
--   - emu.frame_number() is nil
-- v6 uses an internal counter (no emu.frame_number() call), and
-- captures the cold-boot playfield at counter == 180 (~3 s NTSC) with
-- no FIRE press (the docs say the playfield is visible at frame 0).
--
-- Invocation:
--   mame a2600 -cart reference/river-raid-wiz-main/baserom.a26 \
--        -seconds_to_run 6 -nothrottle -video none \
--        -autoboot_script tests/capture.lua

local out_path = "extraction/riverraid_stella_reference.png"
local capture_at_count = 180
local hard_timeout = 360

local count = 0
local captured = false

local register_frame = emu.register_frame or emu.register_frame_callback
if not register_frame then
    print("[capture] FATAL: no emu.register_frame or emu.register_frame_callback")
    return
end

register_frame(function()
    if captured then return end
    count = count + 1

    if count >= capture_at_count then
        local screen = manager and manager:screens():first() or nil
        if screen then
            local ok, err = pcall(function()
                return screen:composite_screenshot(out_path)
            end)
            if ok and err ~= false then
                captured = true
                print(string.format(
                    "[capture] screenshot saved to %s at count %d",
                    out_path, count))
            else
                print(string.format(
                    "[capture] composite_screenshot failed: %s", tostring(err)))
            end
        else
            print("[capture] no screen on manager=" .. tostring(manager))
        end
    end

    if captured or count >= hard_timeout then
        print(string.format("[capture] exit at count %d (captured=%s)",
            count, tostring(captured)))
        emu.exit()
    end
end)
