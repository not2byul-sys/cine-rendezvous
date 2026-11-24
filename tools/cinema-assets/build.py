"""Build static, meter-scale cinema props and render a neutral studio preview."""
import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def linear(value):
    value /= 255
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def material(name, rgb, roughness, metallic=0):
    color = tuple(linear(int(rgb[i:i + 2], 16)) for i in (0, 2, 4)) + (1,)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = color
    return mat


def finish(obj, name, mat, radius=0, segments=2):
    obj.name = name
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    if radius:
        bevel = obj.modifiers.new("Rounded edges", "BEVEL")
        bevel.width = radius
        bevel.segments = segments
        bevel.harden_normals = True
        normals = obj.modifiers.new("Face normals", "WEIGHTED_NORMAL")
        normals.keep_sharp = True
    return obj


def box(name, location, size, mat, edge, segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, edge, segments)


def cylinder(name, location, radius, depth, mat, *, top=None, vertices=20, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius, radius2=radius if top is None else top,
        depth=depth, location=location, rotation=rotation,
    )
    return finish(bpy.context.object, name, mat, min(radius, depth) * .10)


def sphere(name, location, size, mat, segments=12, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.scale = size
    return finish(obj, name, mat)


def pipe(name, points, radius, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 1
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, xyz in zip(spline.points, points):
        point.co = (*xyz, 1)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)


def rounded_loop(x, y, z, half_width, half_depth, corner):
    points = []
    for sx, sy, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for i in range(5):
            angle = math.radians(start + i * 22.5)
            points.append((
                x + sx * (half_width - corner) + corner * math.cos(angle),
                y + sy * (half_depth - corner) + corner * math.sin(angle),
                z,
            ))
    return points


def supplied_sofa():
    source = Path(__file__).with_name("source") / "cinema-sofa.glb"
    bpy.ops.import_scene.gltf(filepath=str(source))
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith("Front cushion welt"):
            bpy.data.objects.remove(obj, do_unlink=True)
    for name, roughness in (("Velvet | clear raspberry burgundy", .72), ("Velvet | cushion", .78)):
        mat = bpy.data.materials[name]
        shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
        shader.inputs["Roughness"].default_value = roughness
    welt = material("Raspberry welt", "95354F", .76)
    for x in (-.51, .51):
        pipe("Continuous seat welt", rounded_loop(x, -.06, .524, .412, .322, .066), .007, welt)
        points = []
        tilt = math.radians(8)
        for px, z, _ in rounded_loop(x, 0, 0, .386, .213, .052):
            # Seat the seam on the rounded bevel before applying the cushion tilt.
            dx = max(0, abs(px - x) - .330)
            dz = max(0, abs(z) - .155)
            y = -.012 - math.sqrt(.085 ** 2 - dx ** 2 - dz ** 2)
            points.append((px, .21 + y * math.cos(tilt) + z * math.sin(tilt),
                           .79 - y * math.sin(tilt) + z * math.cos(tilt)))
        pipe("Continuous back welt", points, .005, welt)


def sofa():
    leather = material("Cognac leather", "B66B43", .44)
    seam = material("Leather piping", "874227", .57)
    brass = material("Brass nailheads", "C99B53", .34, .59)
    wood = material("Walnut", "603926", .48)
    box("Upholstered base", (0, 0, .247), (2.43, .85, .273), leather, .072)
    box("Back support", (0, .34, .625), (2.16, .24, .54), leather, .085)
    cylinder("Rolled back", (0, .32, .865), .101, 2.15, leather, rotation=(0, math.pi / 2, 0))
    for x in (-1.08, 1.08):
        box("Padded arm support", (x, 0, .535), (.29, .84, .43), leather, .09)
        cylinder("Rolled arm", (x, -.015, .758), .145, .891, leather, rotation=(math.pi / 2, 0, 0))
        for y in (-.31, .31):
            cylinder("Turned walnut leg", (x, y, .063), .038, .126, wood, top=.064, vertices=12)
        for i in range(9):
            angle = -.3 + i * math.pi / 8
            sphere("Arm nailhead", (x + math.cos(angle) * .112, -.463, .758 + math.sin(angle) * .112),
                   (.012, .008, .012), brass, 8, 4)
    for i in range(29):
        sphere("Apron nailhead", (-1.14 + i * 2.28 / 28, -.43, .205),
               (.011, .008, .011), brass, 8, 4)
    for x in (-.72, 0, .72):
        box("Boxed seat cushion", (x, -.078, .435), (.695, .626, .15), leather, .062, 4)
        pipe("Cushion welt", rounded_loop(x, -.078, .476, .333, .300, .052), .009, seam)
    # Offset button rows and a quilted surface give the back actual relief.
    buttons = [(x * .229 + (.1145 if j % 2 else 0), .505 + j * .125)
               for j in range(3) for x in range(-4, 5 - j % 2)]
    columns, rows = 64, 20
    verts, faces = [], []
    for j in range(rows + 1):
        z = .403 + j * .441 / rows
        for i in range(columns + 1):
            x = -1.04 + i * 2.08 / columns
            inset = max(math.exp(-((x - bx) / .055) ** 2 - ((z - bz) / .038) ** 2)
                        for bx, bz in buttons)
            verts.append((x, .205 + .026 * inset, z))
            if i and j:
                k = j * (columns + 1) + i
                faces.append((k - columns - 2, k - columns - 1, k, k - 1))
    mesh = bpy.data.meshes.new("Tufted leather surface")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(mesh.name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, mesh.name, leather)
    for x, z in buttons:
        sphere("Covered tuft button", (x, .217, z), (.021, .014, .017), seam, 8, 4)


def table():
    wood = material("Polished walnut", "75472F", .41)
    trim = material("Dark edge band", "4E2D20", .49)
    for z, depth, mat in ((.406, .053, wood), (.37, .022, trim)):
        obj = cylinder("Oval tabletop", (0, 0, z), .50, depth, mat, vertices=40)
        obj.scale.x = .62
    for x in (-.17, .17):
        for y in (-.29, .29):
            cylinder("Tapered table leg", (x, y, .185), .017, .37, wood, top=.032,
                     vertices=12, rotation=(y * .45, -x * .56, 0))


def lamp():
    brass = material("Satin brass", "B98946", .36, .58)
    shade = material("Ivory opal shade", "FFF0D6", .34)
    cylinder("Weighted lamp base", (0, 0, .025), .112, .05, brass, vertices=28)
    cylinder("Tapered stem", (0, 0, .18), .024, .28, brass, top=.017)
    cylinder("Shade foot", (0, 0, .322), .07, .032, brass, vertices=24)
    sphere("Opal globe", (0, 0, .398), (.134, .134, .116), shade, 24, 12)
    cylinder("Finial", (0, 0, .516), .017, .026, brass, top=.012, vertices=12)


def ashtray():
    brass = material("Brushed brass", "C89C56", .43, .59)
    profile = ((.001, 0), (.056, 0), (.072, .025), (.066, .03),
               (.052, .023), (.041, .009), (.001, .009))
    count = 32
    vertices = [(r * math.cos(i * math.tau / count), r * math.sin(i * math.tau / count), z)
                for r, z in profile for i in range(count)]
    faces = [(j * count + i, j * count + (i + 1) % count,
              (j + 1) * count + (i + 1) % count, (j + 1) * count + i)
             for j in range(len(profile) - 1) for i in range(count)]
    faces.extend([tuple(reversed(range(count))), tuple(range(len(vertices) - count, len(vertices)))])
    mesh = bpy.data.meshes.new("Spun brass")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Spun brass ashtray", mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, obj.name, brass)


ASSETS = {"cinema-sofa": (supplied_sofa, 6_500),
          "chesterfield": (sofa, 11_000), "oval-table": (table, 2_000),
          "opal-lamp": (lamp, 2_000), "brass-ashtray": (ashtray, 600)}


def select(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def bake_and_merge(objects):
    groups = {}
    for obj in objects:
        select([obj])
        bpy.ops.object.convert(target="MESH")
        obj = bpy.context.object
        key = tuple(mat.name if mat else None for mat in obj.data.materials)
        groups.setdefault(key, []).append(obj)
    merged = []
    for group in groups.values():
        if len(group) > 1:
            select(group)
            bpy.ops.object.join()
        merged.append(group[0])
    return merged


def triangles(objects):
    count = 0
    for obj in objects:
        obj.data.calc_loop_triangles()
        count += len(obj.data.loop_triangles)
    return count


def stage(objects, path, size, samples):
    corners = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    low = Vector(tuple(min(c[i] for c in corners) for i in range(3)))
    high = Vector(tuple(max(c[i] for c in corners) for i in range(3)))
    center = (low + high) * .5
    span = max(high - low)
    floor = material("Studio backdrop", "BFCAD8", .8)
    box("Studio floor", (center.x, center.y, low.z - .06 * span), (40 * span, 40 * span, .11 * span), floor, 0)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.world = bpy.data.worlds.new("Neutral studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.52, .52, .52, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .28
    scene.view_settings.view_transform = "AgX"
    for offset, power, width in [((-2, -3, 4), 450, 3), ((3, -2, 2), 180, 2.5), ((1, 3, 3), 335, 2)]:
        bpy.ops.object.light_add(type="AREA", location=center + Vector(offset) * span)
        light = bpy.context.object
        light.data.energy = power * span ** 2
        light.data.shape = "DISK"
        light.data.size = width * span
        light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=center + Vector((1.35, -2.6, 1.18)) * span)
    scene.camera = bpy.context.object
    scene.camera.rotation_euler = (center - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type = "ORTHO"
    scene.camera.data.ortho_scale = span * 1.32
    scene.camera.data.clip_start = span * .01
    scene.render.resolution_x = size
    scene.render.resolution_y = round(size * .70)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(path)
    try:
        bpy.ops.render.render(write_still=True)
    except RuntimeError as error:
        if "OpenImageDenoise support" not in str(error):
            raise
        scene.cycles.use_denoising = False
        scene.cycles.samples = max(samples, 48)
        bpy.ops.render.render(write_still=True)


def inspect_glb(path):
    with path.open("rb") as stream:
        magic, version, _ = struct.unpack("<4sII", stream.read(12))
        length, kind = struct.unpack("<I4s", stream.read(8))
        if (magic, version, kind) != (b"glTF", 2, b"JSON"):
            raise ValueError(f"{path} is not a GLB 2.0 file")
        model = json.loads(stream.read(length))
    primitives = [p for mesh in model["meshes"] for p in mesh["primitives"]]
    if any(p.get("mode", 4) != 4 or "indices" not in p for p in primitives):
        raise ValueError(f"{path} has non-indexed triangle geometry")
    return sum(model["accessors"][p["indices"]]["count"] // 3 for p in primitives)


def build(name, builder, budget, args):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if args.source_glb:
        bpy.ops.import_scene.gltf(filepath=str(args.source_glb.resolve()))
    else:
        builder()
    bpy.context.view_layer.update()
    objects = [obj for obj in bpy.context.scene.objects if obj.type in {"MESH", "CURVE"}]
    if not objects:
        raise RuntimeError(f"{name}: no mesh geometry")
    if args.source_glb:
        # Keep imported world placement if glTF nests the meshes under empties.
        for obj in objects:
            matrix = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = matrix
    objects = bake_and_merge(objects)
    count = triangles(objects)
    if count > budget:
        for obj in objects:
            select([obj])
            simplify = obj.modifiers.new("Mobile triangle budget", "DECIMATE")
            simplify.ratio = .93 * budget / count
            bpy.ops.object.modifier_apply(modifier=simplify.name)
    select(objects)
    path = args.output / f"{name}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True)
    count = inspect_glb(path)
    if count > budget:
        raise RuntimeError(f"{name}: {count:,} triangles exceeds the {budget:,} budget")
    print(f"{name}: {count:,}/{budget:,} triangles; {path.stat().st_size:,} bytes", flush=True)
    if not args.no_preview:
        stage(objects, args.output / f"{name}.png", args.size, args.samples)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--asset", choices=ASSETS, action="append")
    parser.add_argument("--source-glb", type=Path, help="Optimize and preview a supplied static sofa")
    parser.add_argument("--no-preview", action="store_true")
    parser.add_argument("--samples", type=int, default=20)
    parser.add_argument("--size", type=int, default=800)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.size < 1 or args.samples < 1:
        parser.error("--size and --samples must be positive")
    if args.source_glb and (args.source_glb.suffix.lower() != ".glb" or not args.source_glb.is_file()):
        parser.error("--source-glb must point to an existing .glb file")
    args.output = args.output.resolve()
    args.output.mkdir(parents=True, exist_ok=True)
    if args.source_glb:
        if args.asset:
            parser.error("--source-glb and --asset are mutually exclusive")
        build("imported-sofa", None, ASSETS["cinema-sofa"][1], args)
        return
    for name in args.asset or ASSETS:
        build(name, *ASSETS[name], args)


if __name__ == "__main__":
    main()
